export interface Donation {
  id: string;
  amount: number;
  date: Date;
  donorName?: string;
  message?: string;
  // Add other relevant fields
}
