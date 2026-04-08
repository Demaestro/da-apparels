import Link from "next/link";

const NAV = [
  { label: "Analytics", href: "/admin" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Fabric Tracking", href: "/admin/fabric" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-obsidian-50 flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-obsidian min-h-screen p-6 flex flex-col gap-8">
        <Link href="/" className="font-display text-xl text-ivory">
          DA<span className="text-gold">.</span>
          <span className="font-sans text-xs tracking-widest uppercase text-obsidian-400 ml-2">Admin</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="font-sans text-xs tracking-widest uppercase text-obsidian-300 hover:text-gold py-2.5 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <Link href="/" className="font-sans text-xs text-obsidian-500 hover:text-gold transition-colors">
            ← Back to shop
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
