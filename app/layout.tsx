import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'WMNDP SL | Sri Lankan Weather Monitoring | ICBT Networking Batch 50 Group Project',
  description: 'Sri Lankan Weather Monitoring and Disaster Prediction System (WMNDP). Live atmospheric data, machine learning forecasts, and disaster prediction.',
  keywords: ['WMNDP SL', 'Sri Lanka weather', 'disaster prediction Sri Lanka', 'weather monitoring', 'weather dashboard'],
  // Fix applied here:
  verification: {
    google: 'a4fyUYwbkrExoSBZQHoB6whpOun3StplUBPpH67hiyA',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
