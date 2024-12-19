"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

export default function Settings() {
  const { signOut, user } = useAuth();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!user) return;
    
    setIsResetting(true);
    try {
      // Default user data state
      const defaultUserData = {
        name: "",
        quest: "",
        level: 1,
        xp: 0,
        profileImage: "/placeholder.svg",
        consecutiveDays: 0,
        lastActivityDate: null,
        skills: [
          { name: "Technique", points: 0, color: "bg-blue-400", xpValue: 50, rank: 1, totalPoints: 0, isLevelingUp: false },
          { name: "Strength", points: 0, color: "bg-yellow-400", xpValue: 50, rank: 1, totalPoints: 0, isLevelingUp: false },
          { name: "Endurance", points: 0, color: "bg-pink-400", xpValue: 50, rank: 1, totalPoints: 0, isLevelingUp: false },
          { name: "Spd/Agility", points: 0, color: "bg-purple-400", xpValue: 50, rank: 1, totalPoints: 0, isLevelingUp: false },
          { name: "Mindset", points: 0, color: "bg-orange-400", xpValue: 25, rank: 1, totalPoints: 0, isLevelingUp: false },
          { name: "Rec/Health", points: 0, color: "bg-red-400", xpValue: 25, rank: 1, totalPoints: 0, isLevelingUp: false },
          { name: "Flexibility", points: 0, color: "bg-green-400", xpValue: 50, rank: 1, totalPoints: 0, isLevelingUp: false }
        ]
      };

      // Reset user data in Firestore
      const userDoc = doc(db, "users", user.uid);
      await setDoc(userDoc, defaultUserData);
      
      // Show success message or handle UI feedback
      alert("Progress reset successfully!");
    } catch (error) {
      console.error("Error resetting progress:", error);
      alert("Failed to reset progress. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 max-w-[100vw] mx-auto overflow-x-hidden">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Account</h2>
          <div className="space-y-4">
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
                  handleReset();
                }
              }}
              disabled={isResetting}
              className="w-full bg-yellow-600 text-white py-3 rounded-lg font-semibold 
                active:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              {isResetting ? "Resetting..." : "Reset All Progress"}
            </button>
            
            <button
              onClick={signOut}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold 
                active:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 