import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#f7f9ff] text-[#161c23]">
      <h2 className="text-4xl font-extrabold mb-2 text-[#ab2f00]">404</h2>
      <p className="text-sm text-[#5b4139] mb-4">Page not found</p>
      <Link
        href="/"
        className="px-4 py-2 rounded-full bg-[#ab2f00] text-white text-xs font-bold hover:bg-[#d53e02] transition"
      >
        Return Home
      </Link>
    </div>
  );
}
