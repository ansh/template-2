"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <header className="w-full max-w-5xl flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold">TemplateHub</h1>
        {!loading &&
          (user ? (
            <Link href="/templates" className="text-blue-500 hover:underline">
              My Templates
            </Link>
          ) : (
            <Link href="/signin" className="text-blue-500 hover:underline">
              Sign In
            </Link>
          ))}
      </header>

      <section className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4">Welcome to TemplateHub</h2>
        <p className="text-xl mb-8">
          Discover and use amazing web app templates to kickstart your next project
        </p>
        <Link
          href={user ? "/templates" : "/signin"}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          {user ? "My Templates" : "Browse Templates"}
        </Link>
      </section>

      <section className="w-full max-w-5xl mb-16">
        <h3 className="text-2xl font-semibold mb-6">Featured Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg overflow-hidden shadow-lg">
              <Image
                src={`https://placehold.co/400x200/${
                  ["orange", "blue", "green"][i - 1]
                }/white?text=Template+${i}`}
                alt={`Template ${i}`}
                width={400}
                height={200}
                className="w-full"
              />
              <div className="p-4">
                <h4 className="font-bold mb-2">Template {i}</h4>
                <p className="text-sm mb-4">A brief description of Template {i}</p>
                <Link href={`/template/${i}`} className="text-blue-500 hover:underline">
                  Learn More
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
