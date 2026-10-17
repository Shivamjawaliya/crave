import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Delivery Partner Portal — Live Trips & Navigation',
  description: 'Accept delivery jobs, update pickup/delivery progress, and stream GPS locations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
