"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

// Real DA Apparels catalogue pieces
const CATALOGUE = [
  {
    slug: "safari-dream-gown",
    name: "Safari Dream Gown",
    tagline: "Where wild meets elegant",
    category: "Evening Gowns",
    price: "₦185,000",
    image: "/catalogue/safari-dream-gown.jpg",
    // colour placeholder shown while image loads / before upload
    bg: "from-amber-900 via-orange-800 to-yellow-700",
  },
  {
    slug: "emerald-garden-mini",
    name: "Emerald Garden Mini",
    tagline: "Nature's finest, worn boldly",
    category: "Day Dresses",
    price: "₦145,000",
    image: "/catalogue/emerald-garden-mini.jpg",
    bg: "from-green-700 via-emerald-500 to-lime-400",
  },
  {
    slug: "emerald-garden-midi",
    name: "Emerald Garden Midi",
    tagline: "Grow in grace",
    category: "Day Dresses",
    price: "₦165,000",
    image: "/catalogue/emerald-garden-midi.jpg",
    bg: "from-green-800 via-emerald-600 to-lime-500",
  },
  {
    slug: "midnight-crimson-gown",
    name: "Midnight Crimson Gown",
    tagline: "Dark romance, reimagined",
    category: "Evening Gowns",
    price: "₦225,000",
    image: "/catalogue/midnight-crimson-gown.jpg",
    bg: "from-neutral-950 via-red-950 to-red-900",
  },
  {
    slug: "royal-amethyst-corset",
    name: "Royal Amethyst Corset",
    tagline: "Reign in colour",
    category: "Corset & Bodycon",
    price: "₦195,000",
    image: "/catalogue/royal-amethyst-corset.jpg",
    bg: "from-purple-950 via-purple-700 to-violet-500",
  },
];

function CatalogueCard({ item, index }: { item: typeof CATALOGUE[0]; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.08 }}
    >
      <Link href={`/products/${item.slug}`} className="group block">
        {/* Image with gradient fallback */}
        <div className={`relative overflow-hidden aspect-[3/4] bg-gradient-to-b ${item.bg}`}>
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-obsidian/0 group-hover:bg-obsidian/20 transition-all duration-500" />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <span className="bg-obsidian text-gold font-sans text-[10px] tracking-widest uppercase px-2 py-1">
              Bespoke
            </span>
            <span className="bg-gold text-obsidian font-sans text-[10px] tracking-widest uppercase px-2 py-1">
              AR Try-On
            </span>
          </div>
          {/* Quick view on hover */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <div className="bg-obsidian text-ivory text-center font-sans text-xs tracking-widest uppercase py-3">
              View Piece
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="pt-4 space-y-1">
          <p className="font-sans text-[10px] tracking-widest uppercase text-gold">
            {item.category}
          </p>
          <h3 className="font-serif text-base text-obsidian leading-snug group-hover:text-gold transition-colors duration-200">
            {item.name}
          </h3>
          <p className="font-sans text-xs text-obsidian-400 line-clamp-1">{item.tagline}</p>
          <p className="font-sans text-sm text-obsidian font-medium mt-1">{item.price}</p>
        </div>
      </Link>
    </motion.article>
  );
}

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex h-screen items-end bg-obsidian overflow-hidden">
        {/* Hero uses the Safari Dream gown as background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-[top_20%_center]"
          style={{ backgroundImage: "url('/catalogue/safari-dream-gown.jpg')" }}
          aria-hidden="true"
        />
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" aria-hidden="true" />

        <div className="relative z-10 max-w-8xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24 w-full">
          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="text-gold tracking-[0.3em] uppercase text-xs font-sans mb-3 sm:mb-4"
          >
            New Collection — 2025
          </motion.p>
          <motion.h1
            variants={fadeUp} initial="hidden" animate="visible" custom={0.15}
            className="font-display text-5xl sm:text-6xl md:text-8xl text-ivory leading-none mb-6 sm:mb-8"
          >
            Crafted for
            <br />
            <em className="text-gold">the Bold.</em>
          </motion.h1>
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={0.3}
            className="flex flex-wrap gap-3 sm:gap-4"
          >
            <Link href="/products" className="btn-primary">Explore Collection</Link>
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

      {/* ── The Edit — Real Catalogue ────────────────────────────────────── */}
      <section className="max-w-8xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="flex items-end justify-between mb-8 sm:mb-12">
          <motion.h2
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="font-display text-3xl sm:text-4xl text-obsidian"
          >
            The Edit
          </motion.h2>
          <Link href="/products" className="font-sans text-xs tracking-widest uppercase text-gold hover:text-obsidian transition-colors hidden sm:block">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
          {CATALOGUE.map((item, i) => (
            <CatalogueCard key={item.slug} item={item} index={i} />
          ))}
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Link href="/products" className="btn-ghost text-obsidian border-obsidian">
            View All Pieces
          </Link>
        </div>
      </section>

      {/* ── Story Strip ─────────────────────────────────────────────────── */}
      <section className="bg-obsidian py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="font-sans text-xs tracking-[0.3em] uppercase text-gold mb-6"
          >
            Our Philosophy
          </motion.p>
          <motion.blockquote
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-display text-3xl sm:text-4xl text-ivory leading-snug mb-8"
          >
            "Every woman deserves a piece that was made{" "}
            <em className="text-gold">only for her.</em>"
          </motion.blockquote>
          <Link href="/ar-tryon" className="btn-primary">Try On a Piece</Link>
        </div>
      </section>
    </>
  );
}
