"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="min-h-screen bg-ivory flex flex-col items-center justify-center text-center px-6">
      <p className="font-sans text-xs tracking-[0.3em] uppercase text-gold mb-4">Error</p>
      <h1 className="font-display text-5xl text-obsidian mb-4">Something went wrong.</h1>
      <p className="font-sans text-sm text-obsidian-400 mb-10 max-w-sm">We're working on it. Please try again or return to the homepage.</p>
      <div className="flex gap-4">
        <button onClick={reset} className="btn-primary">Try Again</button>
        <Link href="/" className="btn-ghost">Go Home</Link>
      </div>
    </div>
  );
}
