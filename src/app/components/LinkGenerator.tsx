import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { Plus } from 'lucide-react'; // Import the Plus icon

interface LinkGeneratorProps {
  onGenerateLink: (childName: string, link: string) => void;
  existingLinksCount: number;
}

const LinkGenerator: React.FC<LinkGeneratorProps> = ({ onGenerateLink, existingLinksCount }) => {
  const [childName, setChildName] = useState('');

  const generateLink = () => {
    if (childName.trim()) {
      if (existingLinksCount >= 10) {
        toast.error("You've reached the maximum number of links (10). Please delete an existing link to create a new one.");
        return;
      }

      const uniqueId = Math.random().toString(36).substring(2, 15);
      const link = `https://sproutfuture.com/donate/${uniqueId}`;
      
      onGenerateLink(childName, link);
      
      toast.success("Success! Your child's future is ready to grow!");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      setChildName('');
    }
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-black">Generate New Donation Link</CardTitle>
        <CardDescription className="text-gray-600">Create a shareable link for contributions to your child's account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="childName" className="text-black">Child's Name</Label>
          <Input 
            id="childName" 
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="Enter child's name" 
          />
        </div>
        <Button 
          onClick={generateLink} 
          className="w-full bg-gradient-to-r from-green-100 to-blue-100 hover:from-green-200 hover:to-blue-200 text-gray-800 border-none shadow-md transition-all duration-300 ease-in-out transform hover:scale-105"
          disabled={existingLinksCount >= 10}
        >
          <Plus size={16} className="mr-2" />
          Generate Link
        </Button>
        {childName.trim() !== '' && existingLinksCount >= 10 && (
          <p className="text-sm text-red-500">You've reached the maximum number of links (10).</p>
        )}
      </CardContent>
    </Card>
  );
};

export default LinkGenerator;
