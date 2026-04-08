import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-obsidian flex flex-col">
      <header className="px-8 py-8">
        <Link href="/" className="font-display text-2xl text-ivory tracking-widest">
          DA<span className="text-gold">.</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        {children}
      </main>
    </div>
  );
}
