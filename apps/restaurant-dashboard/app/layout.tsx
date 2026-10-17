import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Restaurant Portal — Kitchen Operations & Order Management',
  description: 'Live order pipeline, menu editing, and status transitions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#161c23] text-slate-100 antialiased selection:bg-[#ab2f00]/30 selection:text-[#ffdbd1]">
        {children}
      </body>
    </html>
  );
}
