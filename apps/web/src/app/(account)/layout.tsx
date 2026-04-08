import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const ACCOUNT_NAV = [
  { label: "My Vault", href: "/account/vault" },
  { label: "Orders", href: "/account/orders" },
  { label: "Style Profile", href: "/style-quiz" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="max-w-8xl mx-auto w-full px-6 pt-32 pb-24 flex gap-16">
        {/* Sidebar */}
        <aside className="hidden md:block w-52 shrink-0">
          <p className="font-sans text-xs tracking-[0.3em] uppercase text-gold mb-6">My Account</p>
          <nav className="flex flex-col gap-1">
            {ACCOUNT_NAV.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="font-serif text-sm text-obsidian py-2 border-b border-obsidian-100 hover:text-gold transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
