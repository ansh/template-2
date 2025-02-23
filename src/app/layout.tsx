import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from './components/Navigation';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Meme Generator',
  description: 'Generate memes with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`min-h-screen bg-gray-50 ${inter.className}`}>
        <Navigation />
        <main className="container mx-auto px-4 md:px-8 lg:px-12 max-w-7xl">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
