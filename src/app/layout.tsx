import { AuthProvider } from "../contexts/AuthContext";
import { DeepgramContextProvider } from "../contexts/DeepgramContext";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <DeepgramContextProvider>{children}</DeepgramContextProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
