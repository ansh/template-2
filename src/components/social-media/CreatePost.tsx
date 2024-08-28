"use client";

import { useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { addDocument, uploadFile } from "../../lib/firebaseUtils";
import { Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";

export default function CreatePost() {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !user) return;

    setIsUploading(true);
    try {
      const imageUrl = await uploadFile(image, `posts/${Date.now()}_${image.name}`);
      await addDocument("posts", {
        imageUrl,
        caption,
        username: user.displayName || user.email,
        userId: user.uid,
        createdAt: new Date(),
      });
      setImage(null);
      setImagePreview(null);
      setCaption("");
      alert("Post created successfully!");
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Error creating post. Please try again.");
    }
    setIsUploading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-center w-full">
        {imagePreview ? (
          <div className="relative w-full h-64">
            <Image
              src={imagePreview}
              alt="Preview"
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <label
            htmlFor="image"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <ImageIcon className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 800x400px)</p>
            </div>
          </label>
        )}
        <input
          type="file"
          id="image"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
          ref={fileInputRef}
        />
      </div>
      <div>
        <label htmlFor="caption" className="block mb-2">
          Caption:
        </label>
        <textarea
          id="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full p-2 border rounded"
          rows={3}
        />
      </div>
      <button
        type="submit"
        disabled={!image || isUploading}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded disabled:bg-gray-300"
      >
        {isUploading ? "Uploading..." : "Create Post"}
      </button>
    </form>
  );
}
