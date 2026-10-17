import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Crave Kitchen — Partner Portal & KDS',
  description: 'Live kitchen display system, menu & 86 inventory control, and performance settlement ledger.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f5fbf6] font-sans text-[#171d1a] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
