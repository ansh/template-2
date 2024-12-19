"use client";

import { useAuth } from "@/lib/hooks/useAuth";

export default function SignInWithGoogle() {
  const { signInWithGoogle } = useAuth();

  return (
    <button
      onClick={signInWithGoogle}
      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-4 rounded-lg font-semibold 
        active:from-blue-600 active:to-cyan-600 transition-all duration-300 
        flex items-center justify-center gap-3 shadow-lg hover:shadow-cyan-500/20"
    >
      <img src="/google-colored.svg" alt="Google" className="w-6 h-6 bg-white rounded-full p-1" />
      Start Your Quest with Google
    </button>
  );
}
