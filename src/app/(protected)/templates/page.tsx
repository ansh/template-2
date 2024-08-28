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
      <p className="mb-4">This is a protected route. Only authenticated users can see this page.</p>

      {/* Template images */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Image
          src="https://placehold.co/300x200/orange/white?text=Template+1"
          alt="Template 1"
          width={300}
          height={200}
        />
        <Image
          src="https://placehold.co/300x200/blue/white?text=Template+2"
          alt="Template 2"
          width={300}
          height={200}
        />
        <Image
          src="https://placehold.co/300x200/green/white?text=Template+3"
          alt="Template 3"
          width={300}
          height={200}
        />
      </div>

      <Link href="/" className="text-blue-500 hover:underline">
        Back to Home
      </Link>
    </main>
  );
}
