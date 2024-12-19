"use client";

import React, { createContext, useEffect, useState } from "react";
import { init } from '@instantdb/react';
import { useAuth as useAuthClerk } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';

// ID for app: YapThread
const APP_ID = 'b1b31ae5-5bd5-4950-a234-3934c3ea73d7';
// TODO: Change this to clerk-production before deploying to production
const CLERK_CLIENT_NAME = 'clerk';

export const db = init({ appId: APP_ID });

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const { getToken, signOut: clerkSignOut } = useAuthClerk();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();

  const signInToInstantWithClerkToken = async () => {
    try {
      const idToken = await getToken();

      if (!idToken) {
        return;
      }

      // Sign in to InstantDB with Clerk token
      await db.auth.signInWithIdToken({
        clientName: CLERK_CLIENT_NAME,
        idToken: idToken,
      });
    } catch (error) {
      console.error("Error signing in to InstantDB:", error);
    }
  };

  const signOut = async () => {
    try {
      // First sign out of InstantDB
      await db.auth.signOut();
      // Then sign out of Clerk
      await clerkSignOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    console.log("clerkLoaded", clerkLoaded);
    console.log("clerkUser", clerkUser);
    if (clerkLoaded && clerkUser) {
      signInToInstantWithClerkToken();
    }
    setLoading(!clerkLoaded);
  }, [clerkLoaded, clerkUser]);

  const value = {
    user: clerkUser,
    loading: loading,
    signOut: signOut,
  };

  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
