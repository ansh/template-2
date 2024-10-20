import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ImageUpload from '@/components/ImageUpload';
import { uploadFile, checkLinkAvailability, saveGeneratedLinks } from '@/lib/firebase/firebaseUtils';
import { Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from 'react-hot-toast';

interface EditLinkModalProps {
  link: { childName: string; link: string; imageUrl: string };
  userId: string;
  onSave: (updatedLink: { childName: string; link: string; imageUrl: string }) => void;
  onDelete: () => Promise<void>;
  onClose: () => void;
  isDeleting: boolean;
}

const EditLinkModal: React.FC<EditLinkModalProps> = ({ link, userId, onSave, onDelete, onClose, isDeleting }) => {
  const [childName, setChildName] = useState(link.childName);
  const [customLink, setCustomLink] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isCheckingLink, setIsCheckingLink] = useState(false);
  const [isLinkAvailable, setIsLinkAvailable] = useState<boolean | null>(null);
  const [showCustomLinkInput, setShowCustomLinkInput] = useState(false);
  const [currentLink, setCurrentLink] = useState(link.link);
  const [error, setError] = useState<string | null>(null);
  const [showCancelWarning, setShowCancelWarning] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(
      childName !== link.childName ||
      currentLink !== link.link ||
      imageFile !== null
    );
  }, [childName, currentLink, imageFile, link]);

  const handleCheckLink = async () => {
    setIsCheckingLink(true);
    setError(null);
    const fullCustomLink = `https://sproutfuture.com/donate/${customLink}`;
    if (!isValidUrl(fullCustomLink)) {
      setError("Invalid URL characters. Please use only letters, numbers, and hyphens.");
      setIsCheckingLink(false);
      return;
    }
    const isAvailable = await checkLinkAvailability(customLink);
    setIsLinkAvailable(isAvailable);
    setIsCheckingLink(false);
  };

  const handleClaimLink = () => {
    const fullCustomLink = `https://sproutfuture.com/donate/${customLink}`;
    setCurrentLink(fullCustomLink);
    setShowCustomLinkInput(false);
    setCustomLink('');
    setIsLinkAvailable(null);
  };

  const handleSave = async () => {
    let imageUrl = link.imageUrl;
    if (imageFile) {
      const path = `child-images/${childName}-${Date.now()}`;
      imageUrl = await uploadFile(imageFile, path);
    }
    const updatedLink = { childName, link: currentLink, imageUrl };
    try {
      await saveGeneratedLinks(userId, updatedLink, link);
      onSave(updatedLink);
      onClose();
    } catch (error) {
      console.error("Error saving link:", error);
      toast.error("Failed to update link");
    }
  };

  const isValidUrl = (url: string) => {
    const pattern = /^https:\/\/sproutfuture\.com\/donate\/[a-zA-Z0-9-]+$/;
    return pattern.test(url);
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowCancelWarning(true);
    } else {
      onClose();
    }
  };

  const handleDelete = () => {
    setShowDeleteWarning(true);
  };

  const confirmDelete = async () => {
    try {
      await onDelete();
      setShowDeleteWarning(false);
      onClose();
    } catch (error) {
      console.error("Error deleting link:", error);
      toast.error("Failed to delete link");
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Edit Link</h2>
          <div className="mb-4">
            <Label htmlFor="childName">Child's Name</Label>
            <Input
              id="childName"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="mb-4">
            <Label>Current Link</Label>
            <div className="flex items-center mt-1">
              <p className="text-sm text-gray-600 break-all flex-grow mr-2">{currentLink}</p>
              <Button 
                onClick={() => setShowCustomLinkInput(true)} 
                size="sm"
                className="bg-gradient-to-b from-green-100 to-blue-100 text-black font-bold py-2 px-4 rounded transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 hover:shadow-md"
              >
                Customize
              </Button>
            </div>
          </div>
          {showCustomLinkInput && (
            <div className="mb-4">
              <Label htmlFor="customLink">Custom Link</Label>
              <div className="flex items-center mt-1">
                <span className="bg-gray-100 text-gray-500 px-2 py-2 rounded-l-md">
                  sproutfuture.com/donate/
                </span>
                <Input
                  id="customLink"
                  value={customLink}
                  onChange={(e) => setCustomLink(e.target.value)}
                  placeholder="your-custom-link"
                  className="flex-grow rounded-l-none"
                />
              </div>
              <div className="mt-2">
                <Button 
                  onClick={handleCheckLink} 
                  disabled={isCheckingLink} 
                  className="w-full"
                >
                  {isCheckingLink ? 'Checking...' : 'Check Availability'}
                </Button>
              </div>
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              {isLinkAvailable !== null && !error && (
                <div className="mt-2">
                  <p className={`text-sm ${isLinkAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {isLinkAvailable ? 'Link is available!' : 'Link is not available.'}
                  </p>
                  {isLinkAvailable && (
                    <Button 
                      onClick={handleClaimLink} 
                      className="w-full mt-2 bg-gradient-to-r from-green-100 to-blue-100 text-black font-bold py-2 px-4 rounded transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 hover:shadow-md animate-gradient"
                    >
                      Claim Link
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="mb-4">
            <Label>Child's Picture</Label>
            <ImageUpload onImageChange={setImageFile} currentImageUrl={link.imageUrl} />
          </div>
          <div className="flex justify-between">
            <Button onClick={handleSave} className="bg-black text-white hover:bg-gray-800">Save</Button>
            <Button onClick={handleDelete} className="bg-red-500 text-white hover:bg-red-600">Delete</Button>
            <Button onClick={handleCancel} variant="outline">Cancel</Button>
          </div>
        </div>
      </div>

      <Dialog open={showCancelWarning} onOpenChange={setShowCancelWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
          </DialogHeader>
          <p>You have unsaved changes. Are you sure you want to cancel?</p>
          <DialogFooter>
            <Button onClick={() => setShowCancelWarning(false)}>No, keep editing</Button>
            <Button onClick={onClose} variant="destructive">Yes, discard changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteWarning} onOpenChange={setShowDeleteWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this link? This action cannot be undone.</p>
          <DialogFooter>
            <Button onClick={() => setShowDeleteWarning(false)} disabled={isDeleting}>No, keep link</Button>
            <Button onClick={confirmDelete} variant="destructive" disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Yes, delete link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditLinkModal;
