import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AccountSummaryProps {
  balance: number;
}

const AccountSummary: React.FC<AccountSummaryProps> = ({ balance }) => {
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-black">Summary</CardTitle>
        <CardDescription className="text-gray-600">Overview of contributions</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-black">${balance.toFixed(2)}</p>
        <p className="text-sm text-gray-600">Total Contributions</p>
      </CardContent>
    </Card>
  );
};

export default AccountSummary;
