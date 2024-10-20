import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QrCode, Edit } from 'lucide-react'
import EditLinkModal from './EditLinkModal';
import Image from 'next/image';
import { saveGeneratedLinks, deleteGeneratedLink } from '@/lib/firebase/firebaseUtils';
import { toast } from 'react-hot-toast';

interface GeneratedLink {
  childName: string;
  link: string;
  imageUrl: string;
}

interface GeneratedLinksProps {
  links: GeneratedLink[];
  userId: string;
  onUpdateLinks: (updatedLinks: GeneratedLink[]) => void;
}

const GeneratedLinks: React.FC<GeneratedLinksProps> = ({ links, userId, onUpdateLinks }) => {
  const [activeQR, setActiveQR] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<GeneratedLink | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (link: GeneratedLink) => {
    setEditingLink(link);
  };

  const handleSave = async (updatedLink: GeneratedLink) => {
    try {
      const originalLink = links.find(link => link.link === updatedLink.link);
      await saveGeneratedLinks(userId, updatedLink, originalLink);
      const updatedLinks = links.map(link => 
        link.link === updatedLink.link ? updatedLink : link
      );
      onUpdateLinks(updatedLinks);
      toast.success("Link updated successfully");
    } catch (error) {
      console.error("Error saving link:", error);
      toast.error("Failed to update link");
    }
  };

  const handleDelete = async (linkToDelete: GeneratedLink) => {
    setIsDeleting(true);
    try {
      await deleteGeneratedLink(userId, linkToDelete);
      const updatedLinks = links.filter(link => link.childName !== linkToDelete.childName);
      onUpdateLinks(updatedLinks);
      setEditingLink(null);
      toast.success("Link deleted successfully");
    } catch (error) {
      console.error("Error deleting link:", error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      } else {
        console.error("Unknown error:", error);
      }
      toast.error(`Failed to delete link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-black">Generated Donation Links</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {links.map((link, index) => (
          <div key={index} className="border-b pb-4 last:border-b-0 flex items-start">
            <Image 
              src={link.imageUrl || '/default-user-icon.png'}
              alt={`${link.childName}'s picture`}
              width={50}
              height={50}
              style={{ objectFit: 'cover' }}
              className="rounded-full mr-4"
            />
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{link.childName}</h3>
                  <p className="text-sm text-gray-600 break-all">{link.link}</p>
                </div>
                <Button onClick={() => handleEdit(link)} variant="outline" size="sm">
                  <Edit size={16} />
                </Button>
              </div>
              <div className="mt-2 space-x-2">
                <Button 
                  onClick={() => setActiveQR(activeQR === link.link ? null : link.link)}
                  size="sm"
                >
                  {activeQR === link.link ? 'Hide QR Code' : 'Show QR Code'}
                </Button>
              </div>
              {activeQR === link.link && (
                <div className="mt-2 flex justify-center">
                  <QrCode size={100} />
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
      {editingLink && (
        <EditLinkModal
          link={editingLink}
          userId={userId}
          onSave={(updatedLink) => {
            handleSave(updatedLink);
            setEditingLink(null);
          }}
          onDelete={async () => {
            await handleDelete(editingLink);
            setEditingLink(null);
          }}
          onClose={() => setEditingLink(null)}
          isDeleting={isDeleting}
        />
      )}
    </Card>
  );
};

export default GeneratedLinks;
