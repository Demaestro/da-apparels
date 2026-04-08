"use client";

import { motion } from "framer-motion";
import Link from "next/link";

// Framer Motion variants — reusable across luxury sections
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex h-screen items-end bg-obsidian overflow-hidden">
        {/* Replace src with Cloudinary CldImage in production */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: "url('/placeholder-hero.jpg')" }}
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-8xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24 w-full">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="text-gold tracking-[0.3em] uppercase text-xs font-sans mb-3 sm:mb-4"
          >
            New Collection — 2025
          </motion.p>
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.15}
            className="font-display text-5xl sm:text-6xl md:text-8xl text-ivory leading-none mb-6 sm:mb-8"
          >
            Crafted for
            <br />
            <em className="text-gold">the Bold.</em>
          </motion.h1>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.3}
            className="flex flex-wrap gap-3 sm:gap-4"
          >
            <Link href="/products" className="btn-primary">
              Explore Collection
            </Link>
            <Link href="/style-quiz" className="btn-ghost text-ivory border-ivory hover:bg-ivory hover:text-obsidian">
              Take Style Quiz
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Feature Strip ───────────────────────────────────────────────── */}
      <section className="bg-obsidian border-t border-gold/20">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
          {[
            ["Bespoke Tailoring", "Each piece made to measure"],
            ["Fabric Customisation", "Choose your fabric & colour"],
            ["AR Try-On", "See it before you order"],
            ["White-Glove Delivery", "Scheduled to your door"],
          ].map(([title, desc]) => (
            <div key={title}>
              <p className="text-gold font-serif text-sm">{title}</p>
              <p className="text-obsidian-300 font-sans text-xs mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Products placeholder ───────────────────────────────── */}
      <section className="max-w-8xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-display text-3xl sm:text-4xl text-obsidian mb-8 sm:mb-12"
        >
          The Edit
        </motion.h2>
        {/* ProductGrid component will be wired to GET /products API */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] skeleton rounded-none" />
          ))}
        </div>
      </section>
    </>
  );
}
