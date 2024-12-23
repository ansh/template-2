"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { RefreshCw, LogOut, Bell, Shield, HelpCircle } from "lucide-react";

export default function Settings() {
  const { signOut, user } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [notifications, setNotifications] = useState(true);

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

      const userDoc = doc(db, "users", user.uid);
      await setDoc(userDoc, defaultUserData);
      
      alert("Progress reset successfully!");
    } catch (error) {
      console.error("Error resetting progress:", error);
      alert("Failed to reset progress. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-2xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        Settings
      </h1>

      <div className="max-w-md mx-auto space-y-6">
        {/* Notifications */}
        <section className="bg-gray-900/50 rounded-xl p-5 backdrop-blur-sm">
          <h2 className="text-lg font-semibold mb-4 text-blue-400">Notifications</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" />
              <span>Daily Reminders</span>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                notifications ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  notifications ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Privacy & Support */}
        <section className="bg-gray-900/50 rounded-xl p-5 backdrop-blur-sm">
          <h2 className="text-lg font-semibold mb-4 text-purple-400">Privacy & Support</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5" />
                <span>Privacy Policy</span>
              </div>
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5" />
                <span>Help & Support</span>
              </div>
            </button>
          </div>
        </section>

        {/* App Info */}
        <section className="bg-gray-900/50 rounded-xl p-5 backdrop-blur-sm">
          <h2 className="text-lg font-semibold mb-4 text-green-400">App Info</h2>
          <div className="space-y-2 text-gray-400">
            <p>Version: 1.0.0</p>
            <p>Build: 2024.01</p>
          </div>
        </section>

        {/* Danger Zone */}
        <div className="pt-6 space-y-3">
          {/* Reset Progress Button */}
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
                handleReset();
              }
            }}
            disabled={isResetting}
            className="w-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 
              py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${isResetting ? 'animate-spin' : ''}`} />
            {isResetting ? "Resetting..." : "Reset All Progress"}
          </button>
          
          {/* Sign Out Button */}
          <button
            onClick={signOut}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 
              py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
} 