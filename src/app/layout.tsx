import Navigation from './components/Navigation';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4">
          {children}
        </main>
      </body>
    </html>
  );
}
