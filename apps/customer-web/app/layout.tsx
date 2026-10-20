import type { Metadata } from 'next';
import './globals.css';
import ActiveOrderFloatingBanner from '../components/ActiveOrderFloatingBanner';

export const metadata: Metadata = {
  title: 'Crave — Order Delicious Food Online',
  description: 'Fast, fresh, and delivered right to your doorstep.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {children}
        <ActiveOrderFloatingBanner />
      </body>
    </html>
  );
}
