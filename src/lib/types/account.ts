export interface Account {
  id: string;
  type: 'UTMA' | 'UGMA' | '529';
  balance: number;
  // Add other relevant fields
}
