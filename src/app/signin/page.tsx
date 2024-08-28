"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SignInWithGoogle from "../../components/SignInWithGoogle";
import { useAuth } from "../../contexts/AuthContext";

export default function SignIn() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/templates");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Sign In</h1>
        <SignInWithGoogle />
      </div>
    </main>
  );
}
