"use client";

import { useState } from "react";
import Link from "next/link";
import Home from "../../../components/social-media/Home";
import CreatePost from "../../../components/social-media/CreatePost";
import Profile from "../../../components/social-media/Profile";
import { Home as HomeIcon, PlusSquare, User } from "lucide-react";

export default function SocialMedia() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <header className="w-full flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Social Media App</h1>
        <Link href="/templates" className="text-blue-500 hover:underline">
          Back to Templates
        </Link>
      </header>

      <div className="w-full max-w-2xl flex-grow">
        {activeTab === "home" && <Home />}
        {activeTab === "create" && <CreatePost />}
        {activeTab === "profile" && <Profile />}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="flex justify-around max-w-2xl mx-auto">
          <button
            onClick={() => setActiveTab("home")}
            className={`p-4 flex flex-col items-center ${
              activeTab === "home" ? "text-blue-500" : "text-gray-500"
            }`}
          >
            <HomeIcon size={24} />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`p-4 flex flex-col items-center ${
              activeTab === "create" ? "text-blue-500" : "text-gray-500"
            }`}
          >
            <PlusSquare size={24} />
            <span className="text-xs mt-1">Create</span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`p-4 flex flex-col items-center ${
              activeTab === "profile" ? "text-blue-500" : "text-gray-500"
            }`}
          >
            <User size={24} />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
