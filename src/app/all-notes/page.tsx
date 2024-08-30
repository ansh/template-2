"use client";

import { useState, useEffect } from 'react';
import { getDocuments } from '../../lib/firebaseUtils';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Note {
  id: string;
  text: string;
  timestamp: string;
}

export default function AllNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotes() {
      try {
        const fetchedNotes = await getDocuments('notes');
        setNotes(fetchedNotes as Note[]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notes:', error);
        setLoading(false);
      }
    }

    fetchNotes();
  }, []);

  return (
    <div className="min-h-screen bg-[#1c1c1e] text-white font-sans p-4">
      <Link href="/" className="flex items-center text-orange-500 mb-6">
        <ArrowLeft className="mr-2" />
        Back to Recording
      </Link>
      <h1 className="text-3xl font-bold mb-6">All Notes</h1>
      {loading ? (
        <p>Loading notes...</p>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">
                {new Date(note.timestamp).toLocaleString()}
              </p>
              <p>{note.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}