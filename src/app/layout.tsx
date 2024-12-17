import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { AuthProvider } from '@/lib/contexts/AuthContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <ClerkProvider>
        <AuthProvider>
          <body>{children}</body>
        </AuthProvider>
      </ClerkProvider>
    </html>
  );
}
