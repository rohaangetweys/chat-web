import "./globals.css";
import { Inter } from 'next/font/google'


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
    <html lang="en">
      <body
        className={`antialiased flex h-screen bg-gray-400 ${poppins.className}`}
      >
        {children}
      </body>
    </html>
  );
}
