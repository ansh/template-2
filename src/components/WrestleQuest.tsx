"use client";

import { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { useAuth } from "@/lib/hooks/useAuth";
import { Progress } from "@/components/Progress";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/firebase";
import Settings from "@/components/Settings";
import Journal from "@/components/Journal";

const styles = {
  textWithStroke: {
    WebkitTextStroke: '1px black',
    textStroke: '1px black',
    color: 'white',
  } as React.CSSProperties
};

interface Skill {
  name: string;
  points: number;
  color: string;
  xpValue: number;
  rank: number;
  totalPoints: number;
  isLevelingUp: boolean;
}

interface UserData {
  name: string;
  quest: string;
  level: number;
  xp: number;
  profileImage: string;
  lastActivityDate: Date | null;
  skills: [
    { name: "Technique", points: number, color: "bg-blue-400", xpValue: number, rank: number, totalPoints: number, isLevelingUp: boolean },
    { name: "Strength", points: number, color: "bg-yellow-400", xpValue: number, rank: number, totalPoints: number, isLevelingUp: boolean },
    { name: "Endurance", points: number, color: "bg-pink-400", xpValue: number, rank: number, totalPoints: number, isLevelingUp: boolean },
    { name: "Spd/Agility", points: number, color: "bg-purple-400", xpValue: number, rank: number, totalPoints: number, isLevelingUp: boolean },
    { name: "Mindset", points: number, color: "bg-orange-400", xpValue: number, rank: number, totalPoints: number, isLevelingUp: boolean },
    { name: "Rec/Health", points: number, color: "bg-red-400", xpValue: number, rank: number, totalPoints: number, isLevelingUp: boolean },
    { name: "Flexibility", points: number, color: "bg-green-400", xpValue: number, rank: number, totalPoints: number, isLevelingUp: boolean }
  ];
}

interface WrestleQuestProps {
  userId: string;
}

export default function WrestleQuest({ userId }: WrestleQuestProps) {
  const [userData, setUserData] = useState<UserData>({
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
  });

  const [currentPage, setCurrentPage] = useState<'home' | 'journal' | 'settings'>('home');

  // Firebase sync effect (simplified)
  useEffect(() => {
    const userDoc = doc(db, "users", userId);
    
    const unsubscribe = onSnapshot(userDoc, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as UserData;
        setUserData(data);
      } else {
        setDoc(userDoc, userData);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const getRankTitle = (level: number) => {
    if (level >= 50) return "LEGEND";
    if (level >= 25) return "CHAMPION";
    if (level >= 12) return "GRAPPLER";
    if (level >= 5) return "STRIKER";
    return "NOVICE";
  };

  const getXPThreshold = (level: number) => {
    return level * 500;
  };

  const handleAddSkillPoint = async (skillIndex: number) => {
    const today = new Date();
    const newUserData = { ...userData };
    
    if (userData.lastActivityDate) {
      const lastDate = new Date(userData.lastActivityDate);
      const dayDifference = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDifference === 1) {
        newUserData.consecutiveDays += 1;
        if (newUserData.consecutiveDays % 7 === 0) {
          newUserData.skills[skillIndex].points += 1;
          newUserData.skills[skillIndex].totalPoints += 1;
        }
      } else if (dayDifference > 1) {
        newUserData.consecutiveDays = 0;
      }
    }
    
    newUserData.lastActivityDate = today.toISOString();
    newUserData.skills[skillIndex].points += 1;
    newUserData.skills[skillIndex].totalPoints += 1;
    
    // Add XP immediately when skill point is added
    newUserData.xp += newUserData.skills[skillIndex].xpValue;
    
    // Level up if XP reaches 500, but keep excess XP
    if (newUserData.xp >= getXPThreshold(newUserData.level)) {
      newUserData.level += 1;
      // No need to subtract XP anymore, it will continue accumulating
    }
    
    // Check if skill should level up (still at 3 points)
    if (newUserData.skills[skillIndex].points >= 3) {
      newUserData.skills[skillIndex].isLevelingUp = true;
      
      setTimeout(() => {
        const updatedData = { ...newUserData };
        updatedData.skills[skillIndex].points = 0;
        updatedData.skills[skillIndex].rank += 1;
        updatedData.skills[skillIndex].isLevelingUp = false;
        setUserData(updatedData);
        
        const userDoc = doc(db, "users", userId);
        setDoc(userDoc, updatedData);
      }, 500);
    }

    setUserData(newUserData);
    
    const userDoc = doc(db, "users", userId);
    await setDoc(userDoc, newUserData);
  };

  const handleSubtractSkillPoint = async (skillIndex: number) => {
    if (userData.skills[skillIndex].points > 0) {
      const newUserData = { ...userData };
      newUserData.skills[skillIndex].points -= 1;
      newUserData.skills[skillIndex].totalPoints -= 1;
      
      const newXp = Math.max(0, userData.xp - userData.skills[skillIndex].xpValue);
      newUserData.xp = newXp;

      if (newUserData.skills[skillIndex].totalPoints % 3 === 2 && newUserData.skills[skillIndex].rank > 1) {
        newUserData.skills[skillIndex].rank -= 1;
      }

      setUserData(newUserData);
      await saveToFirebase(newUserData);
    }
  };

  const getSkillMaxPoints = (totalPoints: number) => {
    return Math.floor(totalPoints / 3) * 3 + 3;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imageRef = ref(storage, `profile-images/${userId}`);
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      
      const newData = { ...userData, profileImage: downloadURL };
      setUserData(newData);
      await saveToFirebase(newData);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleNameChange = async (name: string) => {
    const newData = { ...userData, name };
    setUserData(newData);
    await saveToFirebase(newData);
  };

  const handleQuestChange = async (quest: string) => {
    const newData = { ...userData, quest };
    setUserData(newData);
    await saveToFirebase(newData);
  };

  const saveToFirebase = async (data: UserData) => {
    const userDoc = doc(db, "users", userId);
    await setDoc(userDoc, data);
  };

  const getLevelGradientColor = (level: number) => {
    if (level >= 50) return "bg-gradient-to-br from-yellow-200 via-amber-400 to-orange-600";
    if (level >= 25) return "bg-gradient-to-br from-rose-300 via-pink-500 to-purple-700";
    if (level >= 12) return "bg-gradient-to-br from-emerald-300 via-green-400 to-green-700";
    if (level >= 5) return "bg-gradient-to-br from-sky-300 via-cyan-400 to-blue-600";
    return "bg-gradient-to-br from-orange-100 via-orange-200 to-orange-300";
  };

  const getProgressBarColor = (level: number) => {
    if (level >= 50) return "from-yellow-200 via-amber-400 to-orange-600";
    if (level >= 25) return "from-rose-300 via-pink-500 to-purple-700";
    if (level >= 12) return "from-emerald-300 via-green-400 to-green-700";
    if (level >= 5) return "from-sky-300 via-cyan-400 to-blue-600";
    return "from-orange-100 via-orange-200 to-orange-300";
  };

  const getProgressValue = (xp: number) => {
    return ((xp % 500) / 500) * 100;
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      <div className="pb-16">
        {currentPage === 'home' ? (
          <div className="p-4 max-w-[100vw] mx-auto overflow-x-hidden">
            <div className="flex items-start gap-3 mb-6">
              <label className="relative cursor-pointer group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-600 bg-gray-700 transition-all duration-300 group-hover:border-white">
                  {userData.profileImage === "/placeholder.svg" ? (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 group-hover:text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-14 w-14"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  ) : (
                    <img
                      src={userData.profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
              <div className="flex-1 pt-4">
                <input
                  type="text"
                  value={userData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="bg-transparent text-2xl font-bold mb-2 w-full focus:outline-none"
                  placeholder="Enter your name"
                />
                <div className="flex items-center text-xl mb-2">
                  <span className="text-gray-400 mr-2">Quest:</span>
                  <input
                    type="text"
                    value={userData.quest}
                    onChange={(e) => handleQuestChange(e.target.value)}
                    className="bg-transparent flex-1 focus:outline-none"
                    placeholder="Enter your quest"
                  />
                </div>
                <div className={`text-xl font-semibold inline-block text-transparent bg-clip-text ${getLevelGradientColor(userData.level)}`}>
                  Level {userData.level} | {getRankTitle(userData.level)}
                </div>
              </div>
            </div>

            <div className="relative mb-8 mx-auto max-w-[90%]">
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 ${getLevelGradientColor(userData.level)} 
                border-2 border-black/30 shadow-lg rotate-45 flex items-center justify-center z-10 
                before:absolute before:inset-[-2px] before:rounded-sm before:bg-gradient-to-br 
                before:from-white/50 before:to-white/10 before:-z-10`}>
                <span className="text-xl font-bold -rotate-45 text-black">{userData.level}</span>
              </div>
              <div className="pl-16">
                <div className="relative">
                  <div className="absolute w-full -top-5 flex justify-center">
                    <span className="font-mono text-sm text-white font-semibold" style={styles.textWithStroke}>
                      XP: {userData.xp}/{getXPThreshold(userData.level)}
                    </span>
                  </div>
                  <Progress 
                    value={getProgressValue(userData.xp)}
                    className="h-6 bg-gray-800"
                    indicatorClassName={`bg-gradient-to-r ${getProgressBarColor(userData.level)}`}
                  />
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-center mb-4">INDIVIDUAL SKILL POINTS</h2>
            <div className="skill-points-section">
              {userData.skills.map((skill, index) => (
                <div key={skill.name} className="flex items-center gap-2 mb-4">
                  <div className="w-24 text-base flex items-center">{skill.name}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs mb-1 flex items-center h-5">
                      skill points: {skill.totalPoints}/{getSkillMaxPoints(skill.totalPoints)}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <Progress 
                          value={skill.isLevelingUp ? 100 : skill.points === 0 ? 5 : ((skill.points / 3) * 100)}
                          className="h-5 bg-gray-800"
                          indicatorClassName={`${skill.color} transition-all duration-300 ease-in-out`}
                        />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-7 h-7 bg-black border border-white flex items-center justify-center text-sm">
                          {skill.rank}
                        </div>
                      </div>
                      <button
                        className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center active:bg-gray-200 transition-colors"
                        onClick={() => handleSubtractSkillPoint(index)}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button
                        className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center active:bg-gray-200 transition-colors"
                        onClick={() => handleAddSkillPoint(index)}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold text-center mb-4">LEVEL SYSTEM</h2>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { level: 1, title: "NOVICE", color: "bg-gradient-to-br from-orange-100 via-orange-200 to-orange-300" },
                  { level: 5, title: "STRIKER", color: "bg-gradient-to-br from-sky-300 via-cyan-400 to-blue-600" },
                  { level: 12, title: "GRAPPLER", color: "bg-gradient-to-br from-emerald-300 via-green-400 to-green-700" },
                  { level: 25, title: "CHAMPION", color: "bg-gradient-to-br from-rose-300 via-pink-500 to-purple-700" },
                  { level: 50, title: "LEGEND", color: "bg-gradient-to-br from-yellow-200 via-amber-400 to-orange-600" }
                ].map((rank) => (
                  <div key={rank.title} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full ${rank.color} flex items-center justify-center text-base font-bold shadow-lg text-white`}>
                      {rank.level}
                    </div>
                    <div className="text-xs mt-1 text-center">{rank.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : currentPage === 'journal' ? (
          <Journal userId={userId} />
        ) : (
          <Settings />
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 safe-bottom">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => setCurrentPage('home')}
            className={`flex flex-col items-center justify-center w-full h-full ${
              currentPage === 'home' ? 'text-white' : 'text-gray-500'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs mt-1">Home</span>
          </button>
          
          <button
            onClick={() => setCurrentPage('journal')}
            className={`flex flex-col items-center justify-center w-full h-full ${
              currentPage === 'journal' ? 'text-white' : 'text-gray-500'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="text-xs mt-1">Journal</span>
          </button>
          
          <button
            onClick={() => setCurrentPage('settings')}
            className={`flex flex-col items-center justify-center w-full h-full ${
              currentPage === 'settings' ? 'text-white' : 'text-gray-500'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-xs mt-1">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
} 