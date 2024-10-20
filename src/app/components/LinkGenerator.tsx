import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

interface LinkGeneratorProps {
  onGenerateLink: (childName: string, link: string) => void;
}

const LinkGenerator: React.FC<LinkGeneratorProps> = ({ onGenerateLink }) => {
  const [childName, setChildName] = useState('');

  const generateLink = () => {
    if (childName.trim()) {
      const uniqueId = Math.random().toString(36).substring(2, 15);
      const link = `https://sproutfuture.com/donate/${uniqueId}`;
      onGenerateLink(childName, link);
      setChildName('');
      
      // Show success message
      toast.success("Success! Your child's future is ready to grow!");
      
      // Trigger confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-black">Generate Donation Link</CardTitle>
        <CardDescription className="text-gray-600">Create a shareable link for contributions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="childName" className="text-black">Child's Name</Label>
          <Input 
            id="childName" 
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="Enter child's name" 
            className="text-black placeholder-gray-400" 
          />
        </div>
        <Button onClick={generateLink} className="w-full bg-black text-white hover:bg-gray-800">Generate Link</Button>
      </CardContent>
    </Card>
  );
};

export default LinkGenerator;
