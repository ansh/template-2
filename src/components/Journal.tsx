"use client";

import { useState, useEffect, useRef } from "react";
import { doc, setDoc, getDoc, collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

interface JournalEntry {
  date: string;
  gratitude: string[];
  actions: string[];
  positives: string;
  opportunities: string;
  bigVision: string;
  journal: string;
}

const AutoGrowTextarea = ({ value, onChange, ...props }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      {...props}
    />
  );
};

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
  const [selectedPastEntry, setSelectedPastEntry] = useState<JournalEntry | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

  const handleViewPastEntry = (entry: JournalEntry) => {
    setSelectedPastEntry(entry);
  };

  const handleBackToList = () => {
    setSelectedPastEntry(null);
  };

  if (showingPastEntries) {
    if (selectedPastEntry) {
      return (
        <div className="p-6 max-w-4xl mx-auto">
          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {format(new Date(selectedPastEntry.date), 'MMMM d, yyyy')}
            </h2>
          </div>

          <div className="space-y-10">
            <section className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-6 text-blue-400">GRATITUDE</h2>
              <div className="space-y-4">
                {selectedPastEntry.gratitude.map((item, index) => (
                  <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                    {item || 'No entry'}
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-6 text-purple-400">ACTIONS</h2>
              <div className="space-y-4">
                {selectedPastEntry.actions.map((item, index) => (
                  <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                    {item || 'No entry'}
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-6 text-orange-400">REFLECT</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 text-orange-300">POSITIVES</h3>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    {selectedPastEntry.positives || 'No entry'}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-orange-300">OPPORTUNITIES</h3>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    {selectedPastEntry.opportunities || 'No entry'}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-orange-300">BIG VISION</h3>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    {selectedPastEntry.bigVision || 'No entry'}
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-6 text-green-400">JOURNAL</h2>
              <div className="bg-gray-800/50 rounded-lg p-4 whitespace-pre-wrap">
                {selectedPastEntry.journal || 'No entry'}
              </div>
            </section>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => setShowingPastEntries(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Journal History
          </h2>
        </div>

        <div className="grid gap-4">
          {pastEntries.map((entry) => (
            <button
              key={entry.date}
              onClick={() => handleViewPastEntry(entry)}
              className="w-full text-left bg-gray-900/50 p-6 rounded-xl hover:bg-gray-800/50 transition-all duration-200 backdrop-blur-sm group"
            >
              <div className="font-semibold text-lg mb-2 group-hover:text-blue-400 transition-colors">
                {format(new Date(entry.date), 'MMMM d, yyyy')}
              </div>
              {entry.journal && (
                <div className="text-gray-400 line-clamp-2">
                  {entry.journal}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          {format(new Date(), 'MMMM d, yyyy')}
        </h2>
        <button
          onClick={loadPastEntries}
          className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          View History
        </button>
      </div>

      <div className="space-y-6">
        <section className="bg-gray-900/50 rounded-xl p-5 backdrop-blur-sm">
          <h2 className="text-lg font-bold mb-3 text-blue-400">GRATITUDE</h2>
          <p className="text-gray-400 mb-3 text-sm">List three things you're grateful for today</p>
          <div className="space-y-3">
            {currentEntry.gratitude.map((item, index) => (
              <input
                key={index}
                type="text"
                value={item}
                onChange={(e) => handleInputChange('gratitude', e.target.value, index)}
                className="w-full bg-gray-800/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400/50 border-none"
                placeholder={`Gratitude ${index + 1}`}
              />
            ))}
          </div>
        </section>

        <section className="bg-gray-900/50 rounded-xl p-5 backdrop-blur-sm">
          <h2 className="text-lg font-bold mb-3 text-purple-400">ACTIONS</h2>
          <p className="text-gray-400 mb-3 text-sm">What actions will you take today?</p>
          <div className="space-y-3">
            {currentEntry.actions.map((item, index) => (
              <input
                key={index}
                type="text"
                value={item}
                onChange={(e) => handleInputChange('actions', e.target.value, index)}
                className="w-full bg-gray-800/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-400/50 border-none"
                placeholder={`Action ${index + 1}`}
              />
            ))}
          </div>
        </section>

        <section className="bg-gray-900/50 rounded-xl p-5 backdrop-blur-sm">
          <h2 className="text-lg font-bold mb-3 text-orange-400">REFLECT</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 text-orange-300">POSITIVES</h3>
              <p className="text-gray-400 mb-2 text-sm">What things did you feel good about or enjoy learning today?</p>
              <textarea
                value={currentEntry.positives}
                onChange={(e) => handleInputChange('positives', e.target.value)}
                className="w-full bg-gray-800/50 rounded-lg p-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-orange-400/50 border-none"
              />
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-orange-300">OPPORTUNITIES</h3>
              <p className="text-gray-400 mb-2 text-sm">What challenges are you having that need improvement?</p>
              <textarea
                value={currentEntry.opportunities}
                onChange={(e) => handleInputChange('opportunities', e.target.value)}
                className="w-full bg-gray-800/50 rounded-lg p-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-orange-400/50 border-none"
              />
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-orange-300">BIG VISION REMINDER</h3>
              <p className="text-gray-400 mb-2 text-sm">Whether it's a goal, vision, or mission, write it down.</p>
              <textarea
                value={currentEntry.bigVision}
                onChange={(e) => handleInputChange('bigVision', e.target.value)}
                className="w-full bg-gray-800/50 rounded-lg p-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-orange-400/50 border-none"
              />
            </div>
          </div>
        </section>

        <section className="bg-gray-900/50 rounded-xl p-5 backdrop-blur-sm">
          <h2 className="text-lg font-bold mb-3 text-green-400">JOURNAL</h2>
          <p className="text-gray-400 mb-2 text-sm">A space to write about anything you want</p>
          <textarea
            value={currentEntry.journal || ''}
            onChange={(e) => handleInputChange('journal', e.target.value)}
            className="w-full bg-gray-800/50 rounded-lg p-3 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-green-400/50 border-none"
          />
        </section>
      </div>
    </div>
  );
} 