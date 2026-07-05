// app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Personal Secure Vault",
  description: "Advanced Secure Storage with Context-Driven Gemini AI Search",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-gray-50 text-gray-900 antialiased selection:bg-blue-500/10">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
