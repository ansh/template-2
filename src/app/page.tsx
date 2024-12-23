"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import SignInWithGoogle from "@/components/SignInWithGoogle";
import WrestleQuest from "@/components/WrestleQuest";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-4">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
          WrestleQuest
        </h1>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-black text-white">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="max-w-md w-full space-y-8 text-center">
            {/* Logo/Title */}
            <div className="space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
                WrestleQuest
              </h1>
              <p className="text-xl font-semibold text-gray-300">
                Level Up Your Wrestling Journey
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid gap-4 my-8">
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-2 text-cyan-400">Track Your Progress</h3>
                <p className="text-gray-300">Monitor growth across 7 key wrestling skills with our intuitive leveling system</p>
              </div>
              
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-2 text-green-400">Stay Motivated</h3>
                <p className="text-gray-300">Transform your training into an RPG-style journey with visual progression</p>
              </div>
              
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-2 text-pink-400">Achieve Goals</h3>
                <p className="text-gray-300">Set and conquer personal quests while working toward wrestling excellence</p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="space-y-4">
              <p className="text-lg text-gray-400">
                Ready to begin your quest?
              </p>
              <SignInWithGoogle />
              <p className="text-sm text-gray-500 mt-4">
                Join other wrestlers on their path to greatness
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return <WrestleQuest userId={user.uid} />;
}
