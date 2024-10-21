"use client";

import { signInWithGoogle } from '@/lib/firebase/firebaseUtils';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function SignInWithGoogle() {
  const router = useRouter();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'PopupClosedByUserError') {
          console.log('Sign-in popup closed by user');
          // Optionally show a user-friendly message
          // toast.info('Sign-in cancelled');
        } else {
          console.error('Error signing in with Google', error);
          toast.error('Failed to sign in. Please try again.');
        }
      } else {
        console.error('Unknown error during sign-in', error);
        toast.error('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <button
      onClick={handleSignIn}
      className="flex items-center justify-center bg-white text-gray-700 font-semibold py-2 px-4 rounded-full border border-gray-300 hover:bg-gray-100 transition duration-300 ease-in-out"
    >
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="w-6 h-6 mr-2" />
      Sign in with Google
    </button>
  );
}
