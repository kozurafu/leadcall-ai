import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LeadCall AI — AI Appointment Setting & Lead Qualification',
  description:
    'Stop chasing cold leads. LeadCall AI calls, qualifies, and books appointments automatically — 24/7.',
  openGraph: {
    title: 'LeadCall AI — AI Appointment Setting & Lead Qualification',
    description:
      'Stop chasing cold leads. LeadCall AI calls, qualifies, and books appointments automatically — 24/7.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
