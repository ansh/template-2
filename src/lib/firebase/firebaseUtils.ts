import { auth, db, storage } from "./firebase";
import { signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";
import { doc, updateDoc, getDoc, setDoc, addDoc, getDocs, deleteDoc, arrayUnion, arrayRemove, collection, serverTimestamp, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject, getMetadata } from "firebase/storage";

// Auth functions
export const logoutUser = () => firebaseSignOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  try {
    const result = await signInWithPopup(auth, provider);
    await createUserDocuments(result.user);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

const createUserDocuments = async (user: User) => {
  const userRef = doc(db, "users", user.uid);
  const accountRef = doc(db, "accounts", user.uid);

  const userSnap = await getDoc(userRef);
  const accountSnap = await getDoc(accountRef);

  if (!userSnap.exists()) {
    try {
      await setDoc(userRef, {
        displayName: user.displayName,
        email: user.email,
        createdAt: new Date(),
        // TODO: Fields below are not implemented anywhere yet
        lastLoginAt: new Date(),
        phoneNumber: user.phoneNumber || null,
        profileImageURL: user.photoURL || null,
        userType: 'parent', // default value, can be changed later
        preferences: {
          notifications: true,
          theme: 'light'
        },
        termsAccepted: false,
        isActive: true,
      });
      console.log("User document created");
    } catch (error) {
      console.error("Error creating user document:", error);
    }
  } else {
    // Update lastLoginAt for existing users
    await updateDoc(userRef, {
      lastLoginAt: new Date()
    });
  }

  if (!accountSnap.exists()) {
    try {
      await setDoc(accountRef, {
        balance: 0,
        createdAt: new Date(),
      });
      console.log("Account document created");
    } catch (error) {
      console.error("Error creating account document:", error);
    }
  }
};

// Firestore functions
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), data);

export const getDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Storage functions
export const uploadFile = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export const getAccountBalance = async (userId: string): Promise<number> => {
  try {
    const accountDoc = await getDoc(doc(db, "accounts", userId));
    if (accountDoc.exists()) {
      return accountDoc.data().balance || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching account balance:", error);
    return 0;
  }
};

export const getGeneratedLinks = async (userId: string) => {
  try {
    const userLinksDoc = await getDoc(doc(db, "userLinks", userId));
    if (userLinksDoc.exists()) {
      return userLinksDoc.data().links || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching generated links:", error);
    return [];
  }
};

export const checkLinkAvailability = async (customLink: string): Promise<boolean> => {
  const linkRef = doc(db, "customLinks", customLink);
  const linkDoc = await getDoc(linkRef);
  return !linkDoc.exists();
};

export const saveGeneratedLinks = async (userId: string, newLink: {childName: string, link: string, imageUrl: string}, originalLink?: {childName: string, link: string, imageUrl: string}) => {
  const userLinksRef = doc(db, "userLinks", userId);
  
  try {
    const docSnap = await getDoc(userLinksRef);
    let links: any[] = [];

    if (docSnap.exists()) {
      const data = docSnap.data();
      links = Array.isArray(data.links) ? data.links : [];

      if (originalLink) {
        // Editing an existing link
        links = links.map((link: any) => {
          if (link.link === originalLink.link) {
            // Delete old image if it's different from the new one and not the default
            if (originalLink.imageUrl !== newLink.imageUrl && originalLink.imageUrl !== '/default-user-icon.png') {
              const oldImageRef = ref(storage, originalLink.imageUrl);
              // Check if the file exists before attempting to delete
              getMetadata(oldImageRef)
                .then(() => deleteObject(oldImageRef))
                .catch(error => {
                  if (error.code === 'storage/object-not-found') {
                    console.log("Old image not found, skipping deletion");
                  } else {
                    console.error("Error checking/deleting old image:", error);
                  }
                });
            }
            return {
              ...newLink,
              lastEditedAt: Timestamp.now()
            };
          }
          return link;
        });

        // Update customLinks collection if the link has changed
        if (originalLink.link !== newLink.link) {
          const oldCustomLinkRef = doc(db, "customLinks", originalLink.link.split('/').pop() || '');
          await deleteDoc(oldCustomLinkRef);
          
          const newCustomLinkRef = doc(db, "customLinks", newLink.link.split('/').pop() || '');
          await setDoc(newCustomLinkRef, { userId: userId });
        }
      } else {
        // Adding a new link
        if (links.length >= 10) {
          throw new Error("Maximum number of links (10) reached.");
        }
        // Check if the link already exists
        const existingLinkIndex = links.findIndex((link: any) => link.link === newLink.link);
        if (existingLinkIndex !== -1) {
          // Update the existing link
          links[existingLinkIndex] = {
            ...newLink,
            lastEditedAt: Timestamp.now()
          };
        } else {
          // Add a new link
          links.push({
            ...newLink,
            createdAt: Timestamp.now(),
            lastEditedAt: Timestamp.now()
          });
        }

        // Add new custom link for a new entry
        const customLinkRef = doc(db, "customLinks", newLink.link.split('/').pop() || '');
        await setDoc(customLinkRef, { userId: userId });
      }

      await updateDoc(userLinksRef, { links });
    } else {
      // Create new document with the link
      links = [{
        ...newLink,
        createdAt: Timestamp.now(),
        lastEditedAt: Timestamp.now()
      }];
      await setDoc(userLinksRef, { links });

      // Add to customLinks collection
      const customLinkRef = doc(db, "customLinks", newLink.link.split('/').pop() || '');
      await setDoc(customLinkRef, { userId: userId });
    }

    // Track edit event
    await trackLinkEditEvent(userId, newLink);

    return links; // Return the updated links array

  } catch (error) {
    console.error("Error saving generated link:", error);
    throw error;
  }
};

export const deleteGeneratedLink = async (userId: string, linkToDelete: {childName: string, link: string, imageUrl: string}) => {
  const userLinksRef = doc(db, "userLinks", userId);
  
  try {
    const docSnap = await getDoc(userLinksRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const links = Array.isArray(data.links) ? data.links : [];

      const updatedLinks = links.filter((link: any) => link.childName !== linkToDelete.childName);

      await updateDoc(userLinksRef, { links: updatedLinks });

      // Remove from customLinks collection
      const customLinkRef = doc(db, "customLinks", linkToDelete.link.split('/').pop() || '');
      await deleteDoc(customLinkRef);

      // Delete associated image file
      if (linkToDelete.imageUrl && linkToDelete.imageUrl !== '/default-user-icon.png') {
        const imageRef = ref(storage, linkToDelete.imageUrl);
        await deleteObject(imageRef);
      }

      // Track delete event
      await trackLinkDeleteEvent(userId, linkToDelete);
    } else {
      throw new Error("User document not found");
    }
  } catch (error) {
    console.error("Error in deleteGeneratedLink:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to delete link: ${error.message}`);
    } else {
      throw new Error("Failed to delete link: Unknown error");
    }
  }
};

const trackLinkEditEvent = async (userId: string, updatedLink: {childName: string, link: string, imageUrl: string}) => {
  const editEventRef = collection(db, "linkEditEvents");
  await addDoc(editEventRef, {
    userId,
    childName: updatedLink.childName,
    link: updatedLink.link,
    imageUrl: updatedLink.imageUrl,
    editedAt: serverTimestamp()
  });
};

const trackLinkDeleteEvent = async (userId: string, deletedLink: {childName: string, link: string, imageUrl: string}) => {
  const deleteEventRef = collection(db, "linkDeleteEvents");
  await addDoc(deleteEventRef, {
    userId,
    childName: deletedLink.childName,
    link: deletedLink.link,
    deletedAt: serverTimestamp()
  });
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};
