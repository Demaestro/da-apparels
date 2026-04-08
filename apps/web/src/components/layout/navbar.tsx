"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store/cart.store";

const NAV_LINKS = [
  { label: "Collections", href: "/products" },
  { label: "Bespoke", href: "/bespoke" },
  { label: "Style Quiz", href: "/style-quiz" },
  { label: "AR Try-On", href: "/ar-tryon" },
  { label: "About", href: "/about" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-obsidian/95 backdrop-blur-md border-b border-gold/10"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-8xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Real logo */}
        <Link href="/" className="shrink-0">
          <Image
            src="/logo.svg"
            alt="DA's Apparel"
            width={160}
            height={48}
            className="h-9 sm:h-11 w-auto brightness-0 invert"
            priority
          />
        </Link>

        {/* Desktop links */}
        <ul className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className="font-sans text-xs tracking-[0.2em] uppercase text-obsidian-300 hover:text-gold transition-colors duration-200 whitespace-nowrap"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/account/vault" aria-label="My account" className="hidden sm:block text-obsidian-300 hover:text-gold transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </Link>

          {/* Cart + count badge */}
          <Link href="/checkout" aria-label="Cart" className="relative text-obsidian-300 hover:text-gold transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
            </svg>
            {itemCount > 0 && (
              <motion.span
                key={itemCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-gold text-obsidian font-sans text-[9px] font-bold flex items-center justify-center"
              >
                {itemCount > 9 ? "9+" : itemCount}
              </motion.span>
            )}
          </Link>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-ivory p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? "M6 18 18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-obsidian border-t border-gold/10 px-6 py-6 flex flex-col gap-5"
          >
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                className="font-sans text-sm tracking-[0.2em] uppercase text-obsidian-200 hover:text-gold transition-colors py-1">
                {label}
              </Link>
            ))}
            <div className="border-t border-gold/10 pt-4 flex gap-6">
              <Link href="/account/vault" onClick={() => setMenuOpen(false)} className="font-sans text-xs text-obsidian-400 hover:text-gold transition-colors tracking-widest uppercase">Account</Link>
              <Link href="/checkout" onClick={() => setMenuOpen(false)} className="font-sans text-xs text-obsidian-400 hover:text-gold transition-colors tracking-widest uppercase">
                Cart{itemCount > 0 ? ` (${itemCount})` : ""}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
