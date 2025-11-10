import { ThemeProvider } from "@/contexts/ThemeContext";
import "./globals.css";
import { Inter } from 'next/font/google';
import { Toaster } from "react-hot-toast";

const poppins = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata = {
  title: "Chat App",
  description: "By Rohaan",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased flex h-screen bg-gray-400 ${poppins.className}`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#0084ff', color: 'white', border: '1px solid #0084ff' } }} />
      </body>
    </html>
  );
}