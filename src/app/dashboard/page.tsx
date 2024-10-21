"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getAccountBalance, getGeneratedLinks, saveGeneratedLinks } from '@/lib/firebase/firebaseUtils';
import DashboardInterface from '@/app/components/DashboardInterface';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

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
        const updatedLinks = await saveGeneratedLinks(user.uid, newLink);
        setGeneratedLinks(updatedLinks);
      } catch (error) {
        console.error("Error generating link:", error);
        toast.error("Failed to generate link. Please try again.");
      }
    }
  };

  const handleProfileClick = () => {
    console.log("Navigate to profile page");
  }

  const handleUpdateLinks = (updatedLinks: Array<{childName: string, link: string, imageUrl: string}>) => {
    setGeneratedLinks(updatedLinks);
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
