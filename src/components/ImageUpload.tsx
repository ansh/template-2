import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button"
import Image from "next/image";
import { Edit } from "lucide-react";

interface ImageUploadProps {
  onImageChange: (file: File | null) => void;
  currentImageUrl?: string;
}

export default function ImageUpload({ onImageChange, currentImageUrl }: ImageUploadProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size should be less than 10MB');
        return;
      }
      onImageChange(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex items-center justify-center w-full">
      {imagePreview ? (
        <div className="relative w-full h-64">
          <Image
            src={imagePreview}
            alt="Preview"
            layout="fill"
            objectFit="contain"
            className="rounded-lg"
          />
          <Button
            type="button"
            onClick={handleEditClick}
            className="absolute top-2 right-2 bg-white text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <Edit size={20} />
          </Button>
        </div>
      ) : (
        <label
          htmlFor="image"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 10MB)</p>
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
  );
}
