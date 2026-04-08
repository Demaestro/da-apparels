import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Page Not Found" };

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ivory flex flex-col items-center justify-center text-center px-6">
      <p className="font-sans text-xs tracking-[0.3em] uppercase text-gold mb-4">404</p>
      <h1 className="font-display text-6xl text-obsidian mb-4">Page not found.</h1>
      <p className="font-sans text-sm text-obsidian-400 mb-10">The piece you're looking for doesn't exist or has been moved.</p>
      <Link href="/" className="btn-primary">Return to Homepage</Link>
    </div>
  );
}
