"use client";

import Link from "next/link";
import Image from "next/image";
import { auth } from "../../../lib/firebase";

export default function Templates() {
  const signOut = () => {
    auth.signOut().then(() => {
      window.location.href = "/";
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <header className="w-full flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Templates</h1>
        <button onClick={signOut} className="text-blue-500 hover:underline">
          Sign Out
        </button>
      </header>
      <p className="mb-4">Choose a template to get started with your project:</p>

      {/* Template grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        {/* Chat Template */}
        <div className="border rounded-lg overflow-hidden shadow-lg">
          <Image
            src="https://placehold.co/300x200/4299E1/ffffff?text=Chat+App"
            alt="Chat App Template"
            width={300}
            height={200}
          />
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-2">Chat App</h2>
            <p className="text-gray-600 mb-4">Real-time chat application with AI integration.</p>
            <Link href="/chat" className="text-blue-500 hover:underline">
              Try Demo
            </Link>
          </div>
        </div>

        {/* Image Generation Template */}
        <div className="border rounded-lg overflow-hidden shadow-lg">
          <Image
            src="https://placehold.co/300x200/10B981/ffffff?text=Image+Generation"
            alt="Image Generation Template"
            width={300}
            height={200}
          />
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-2">Image Generation</h2>
            <p className="text-gray-600 mb-4">AI-powered image creation tool.</p>
            <Link href="/image-generation" className="text-blue-500 hover:underline">
              Try Demo
            </Link>
          </div>
        </div>

        {/* Social Media App Template */}
        <div className="border rounded-lg overflow-hidden shadow-lg">
          <Image
            src="https://placehold.co/300x200/F59E0B/ffffff?text=Social+Media+App"
            alt="Social Media App Template"
            width={300}
            height={200}
          />
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-2">Social Media App</h2>
            <p className="text-gray-600 mb-4">Build your own social network platform.</p>
            <Link href="/social-media" className="text-blue-500 hover:underline">
              Try Demo
            </Link>
          </div>
        </div>
      </div>

      <Link href="/" className="text-blue-500 hover:underline">
        Back to Home
      </Link>
    </main>
  );
}
