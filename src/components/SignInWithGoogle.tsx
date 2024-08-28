"use client";

import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../lib/firebase";
import Image from "next/image";

export default function SignInWithGoogle() {
  const signIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  return (
    <button
      onClick={signIn}
      className="flex items-center justify-center w-full bg-white text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <Image src="/google-logo.png" alt="Google logo" width={20} height={20} className="mr-2" />
      Sign in with Google
    </button>
  );
}
