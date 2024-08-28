"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { updateDocument } from "../../lib/firebaseUtils";

export default function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.displayName || "");
      setUsername(user.displayName || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await updateDocument("users", user.uid, { name, username });
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block mb-2">
          Name:
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label htmlFor="username" className="block mb-2">
          Username:
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded">
        Update Profile
      </button>
    </form>
  );
}
