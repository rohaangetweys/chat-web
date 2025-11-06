import "./globals.css";
import { Poppins } from 'next/font/google'


const poppins = Poppins({
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
        className={`antialiased ${poppins.className}`}
      >
        {children}
      </body>
    </html>
  );
}
