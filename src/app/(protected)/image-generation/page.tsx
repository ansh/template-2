"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ImageGeneration() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setImage(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate image");
      }

      const data = await response.json();
      // The Stable Diffusion model returns an array of image URLs
      setImage(data.output[0]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100">
      <div className="w-full max-w-2xl">
        <header className="w-full flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Image Generation</h1>
          <Link href="/templates" className="text-blue-500 hover:underline">
            Back to Templates
          </Link>
        </header>

        <form
          className="w-full flex flex-col bg-white p-6 rounded-lg shadow-md"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-grow p-2 mb-4 border rounded"
            placeholder="Enter a prompt to generate an image"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Image"}
          </button>
        </form>

        {error && (
          <div className="text-red-500 mt-4 bg-white p-4 rounded-lg shadow-md">{error}</div>
        )}

        {image && (
          <div className="mt-8 bg-white p-4 rounded-lg shadow-md">
            <Image src={image} alt="Generated image" width={512} height={512} className="rounded" />
          </div>
        )}
      </div>
    </main>
  );
}
