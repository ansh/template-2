"use client";

import { useState, useEffect } from "react";
import { doc, setDoc, getDoc, collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { format } from "date-fns";

interface JournalEntry {
  date: string;
  gratitude: string[];
  actions: string[];
  positives: string;
  opportunities: string;
  bigVision: string;
  journal: string;
}

export default function Journal({ userId }: { userId: string }) {
  const [currentEntry, setCurrentEntry] = useState<JournalEntry>({
    date: format(new Date(), 'yyyy-MM-dd'),
    gratitude: ['', '', ''],
    actions: ['', '', ''],
    positives: '',
    opportunities: '',
    bigVision: '',
    journal: ''
  });
  const [showingPastEntries, setShowingPastEntries] = useState(false);
  const [pastEntries, setPastEntries] = useState<JournalEntry[]>([]);

  // Load today's entry or create new one
  useEffect(() => {
    const loadTodayEntry = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const entryRef = doc(db, `users/${userId}/journal`, today);
      const entrySnap = await getDoc(entryRef);
      
      if (entrySnap.exists()) {
        setCurrentEntry(entrySnap.data() as JournalEntry);
      }
    };
    
    loadTodayEntry();
  }, [userId]);

  const handleInputChange = async (
    field: keyof JournalEntry,
    value: string | string[],
    index?: number
  ) => {
    const newEntry = { ...currentEntry };
    
    if (Array.isArray(newEntry[field]) && typeof index === 'number') {
      (newEntry[field] as string[])[index] = value as string;
    } else {
      newEntry[field] = value;
    }
    
    setCurrentEntry(newEntry);
    
    // Save to Firebase
    const entryRef = doc(db, `users/${userId}/journal`, currentEntry.date);
    await setDoc(entryRef, newEntry);
  };

  const loadPastEntries = async () => {
    const entriesRef = collection(db, `users/${userId}/journal`);
    const q = query(entriesRef, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const entries = querySnapshot.docs.map(doc => doc.data() as JournalEntry);
    setPastEntries(entries);
    setShowingPastEntries(true);
  };

  if (showingPastEntries) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Past Entries</h1>
          <button 
            onClick={() => setShowingPastEntries(false)}
            className="bg-gray-800 px-4 py-2 rounded-lg"
          >
            Back to Today
          </button>
        </div>
        <div className="space-y-6">
          {pastEntries.map((entry) => (
            <div key={entry.date} className="bg-gray-900 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">{format(new Date(entry.date), 'MMMM d, yyyy')}</h2>
              {/* Display past entry content */}
              {/* Add more sections as needed */}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{format(new Date(currentEntry.date), 'MMMM d, yyyy')}</h1>
        <button 
          onClick={loadPastEntries}
          className="bg-gray-800 px-4 py-2 rounded-lg"
        >
          View Past Entries
        </button>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-bold mb-4">GRATITUDE</h2>
          <p className="text-gray-400 mb-2">Today I'm grateful for...</p>
          {currentEntry.gratitude.map((item, index) => (
            <input
              key={index}
              type="text"
              value={item}
              onChange={(e) => handleInputChange('gratitude', e.target.value, index)}
              className="w-full bg-transparent border-b border-gray-700 py-2 mb-2 focus:outline-none focus:border-white"
              placeholder={`${index + 1}.`}
            />
          ))}
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">TODAY'S ACTION</h2>
          <p className="text-gray-400 mb-2">What actions will you take today?</p>
          {currentEntry.actions.map((item, index) => (
            <input
              key={index}
              type="text"
              value={item}
              onChange={(e) => handleInputChange('actions', e.target.value, index)}
              className="w-full bg-transparent border-b border-gray-700 py-2 mb-2 focus:outline-none focus:border-white"
              placeholder={`${index + 1}.`}
            />
          ))}
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">REFLECT</h2>
          
          <div className="mb-6">
            <h3 className="font-semibold mb-2">POSITIVES</h3>
            <p className="text-gray-400 mb-2">What things did you feel good about or enjoy learning today?</p>
            <textarea
              value={currentEntry.positives}
              onChange={(e) => handleInputChange('positives', e.target.value)}
              className="w-full bg-transparent border border-gray-700 rounded-lg p-2 min-h-[100px] focus:outline-none focus:border-white"
            />
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">OPPORTUNITIES</h3>
            <p className="text-gray-400 mb-2">What challenges are you having that need improvement?</p>
            <textarea
              value={currentEntry.opportunities}
              onChange={(e) => handleInputChange('opportunities', e.target.value)}
              className="w-full bg-transparent border border-gray-700 rounded-lg p-2 min-h-[100px] focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <h3 className="font-semibold mb-2">BIG VISION REMINDER</h3>
            <p className="text-gray-400 mb-2">Whether it's a goal, vision, or mission, write it down.</p>
            <textarea
              value={currentEntry.bigVision}
              onChange={(e) => handleInputChange('bigVision', e.target.value)}
              className="w-full bg-transparent border border-gray-700 rounded-lg p-2 min-h-[100px] focus:outline-none focus:border-white"
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">JOURNAL</h2>
          <p className="text-gray-400 mb-2">A space to write about anything you want</p>
          <textarea
            value={currentEntry.journal || ''}
            onChange={(e) => handleInputChange('journal', e.target.value)}
            className="w-full bg-transparent border border-gray-700 rounded-lg p-2 min-h-[200px] focus:outline-none focus:border-white"
          />
        </section>
      </div>
    </div>
  );
} 