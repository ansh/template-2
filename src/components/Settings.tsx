"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { RefreshCw, LogOut, Bell, Shield, HelpCircle, X } from "lucide-react";

export default function Settings() {
  const { signOut, user } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

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

  const privacyPolicy = `
    Privacy Policy for WrestleQuest

    1. Data Collection
    We collect only the information necessary to track your wrestling progress, including:
    - Basic profile information
    - Training data and skill progression
    - Journal entries
    
    2. Data Usage
    Your data is used exclusively to:
    - Power your personal wrestling journey
    - Track your progress over time
    - Provide personalized training insights
    
    3. Data Protection
    - All data is stored securely on Firebase
    - Your information is never sold or shared
    - You maintain full control of your data
    
    4. Your Rights
    You can:
    - Reset your progress at any time
    - Delete your account and all associated data
    - Export your training history
  `;

  const faqItems = [
    {
      question: "How do skill points work?",
      answer: "Skill points are earned by completing activities. Each activity has a specific duration and XP value. Once you complete the activity, you'll earn points that contribute to your skill level."
    },
    {
      question: "How do I level up?",
      answer: "You level up by earning XP through activities. Every 500 XP equals one level. Your overall level is calculated based on your combined progress across all skills."
    },
    {
      question: "Can I change my quest?",
      answer: "Yes! You can update your quest at any time from the home screen. Click on your current quest to edit it and set a new goal."
    }
  ];

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
          <h2 className="text-lg font-semibold mb-4 text-purple-400">Help & Information</h2>
          <div className="space-y-3">
            <button 
              onClick={() => setShowPrivacy(true)} 
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5" />
                <span>Privacy Policy</span>
              </div>
            </button>
            <button 
              onClick={() => setShowFAQ(true)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5" />
                <span>Common Questions</span>
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

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-purple-400">Privacy Policy</h3>
              <button onClick={() => setShowPrivacy(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4 text-gray-300 whitespace-pre-line">
              {privacyPolicy}
            </div>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {showFAQ && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-purple-400">Common Questions</h3>
              <button onClick={() => setShowFAQ(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-6">
              {faqItems.map((item, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="font-semibold text-blue-400">{item.question}</h4>
                  <p className="text-gray-300">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 