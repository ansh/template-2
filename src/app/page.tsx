"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import SignInWithGoogle from "@/components/SignInWithGoogle"
import { useAuth } from '@/lib/hooks/useAuth';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-blue-100 flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-md">
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-gray-800">Welcome to SproutFuture</CardTitle>
            <CardDescription className="text-center text-gray-600">Invest in your child's future, effortlessly</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <p className="text-center text-gray-700">Sign in to get started:</p>
            <SignInWithGoogle />
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-xs text-center text-gray-500">
              By continuing, you agree to SproutFuture's Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
