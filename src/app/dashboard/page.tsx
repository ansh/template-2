"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getAccountBalance, getGeneratedLinks, saveGeneratedLinks } from '@/lib/firebase/firebaseUtils';
import DashboardInterface from '@/app/components/DashboardInterface';
import { Toaster } from 'react-hot-toast';

export default function Dashboard() {
  const [accountBalance, setAccountBalance] = useState(0)
  const [generatedLinks, setGeneratedLinks] = useState<Array<{childName: string, link: string, imageUrl: string}>>([])
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const balance = await getAccountBalance(user.uid);
        setAccountBalance(balance);
        const links = await getGeneratedLinks(user.uid);
        setGeneratedLinks(links);
      };
      fetchData();
    }
  }, [user]);

  const handleGenerateLink = async (childName: string, link: string) => {
    const newLink = { childName, link, imageUrl: '/default-user-icon.png' };
    if (user) {
      try {
        await saveGeneratedLinks(user.uid, newLink);
        const updatedLinks = await getGeneratedLinks(user.uid);
        setGeneratedLinks(updatedLinks);
      } catch (error) {
        console.error("Error generating link:", error);
        // Here you might want to show an error message to the user
      }
    }
  };

  const handleProfileClick = () => {
    console.log("Navigate to profile page");
  }

  const handleUpdateLinks = async (updatedLinks: Array<{childName: string, link: string, imageUrl: string}>) => {
    setGeneratedLinks(updatedLinks);
    if (user) {
      try {
        for (const link of updatedLinks) {
          await saveGeneratedLinks(user.uid, link, link); // Pass the same link as both new and original to indicate an update
        }
      } catch (error) {
        console.error("Error updating links:", error);
        // Here you might want to show an error message to the user
      }
    }
  };

  if (loading) {
    return <div className="text-black">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <DashboardInterface
        user={user}
        accountBalance={accountBalance}
        onSignOut={signOut}
        onProfileClick={handleProfileClick}
        generatedLinks={generatedLinks}
        onGenerateLink={handleGenerateLink}
        onUpdateLinks={handleUpdateLinks}
      />
      <Toaster />
    </>
  )
}
