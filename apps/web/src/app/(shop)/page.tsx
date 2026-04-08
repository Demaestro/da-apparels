"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { getFeaturedCatalogueProducts } from "@/lib/catalogue-data";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const FEATURED_CATALOGUE = getFeaturedCatalogueProducts();

function formatPrice(amount: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

function CatalogueCard({
  item,
  index,
}: {
  item: (typeof FEATURED_CATALOGUE)[number];
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.08 }}
    >
      <Link href={`/products/${item.slug}`} className="group block">
        <div className="relative overflow-hidden aspect-[3/4] bg-obsidian-100">
          <Image
            src={item.images[0]?.url ?? "/catalogue/safari-sundress.jpg"}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            quality={86}
          />
          <div className="absolute inset-0 bg-obsidian/0 group-hover:bg-obsidian/20 transition-all duration-500" />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <span className="bg-obsidian text-gold font-sans text-[10px] tracking-widest uppercase px-2 py-1">
              Bespoke
            </span>
            <span className="bg-gold text-obsidian font-sans text-[10px] tracking-widest uppercase px-2 py-1">
              AR Ready
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <div className="bg-obsidian text-ivory text-center font-sans text-xs tracking-widest uppercase py-3">
              View Piece
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-1">
          <p className="font-sans text-[10px] tracking-widest uppercase text-gold">
            {item.category.name}
          </p>
          <h3 className="font-serif text-base text-obsidian leading-snug group-hover:text-gold transition-colors duration-200">
            {item.name}
          </h3>
          <p className="font-sans text-xs text-obsidian-400 line-clamp-2">{item.tagline}</p>
          <p className="font-sans text-sm text-obsidian font-medium mt-1">
            {formatPrice(item.basePrice)}
          </p>
        </div>
      </Link>
    </motion.article>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="relative flex h-screen items-end bg-obsidian overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-[top_20%_center]"
          style={{ backgroundImage: "url('/catalogue/safari-sundress.jpg')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" aria-hidden="true" />

        <div className="relative z-10 max-w-8xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24 w-full">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="text-gold tracking-[0.3em] uppercase text-xs font-sans mb-3 sm:mb-4"
          >
            DA Apparels • New Edit
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
            <Link href="/products" className="btn-primary">Explore Collection</Link>
            <Link href="/bespoke" className="btn-ghost text-ivory border-ivory hover:bg-ivory hover:text-obsidian">
              Book Bespoke
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="bg-obsidian border-t border-gold/20">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
          {[
            ["Made To Measure", "Every silhouette is shaped around the client."],
            ["Fabric Direction", "Choose colour, mood, and finish with our team."],
            ["AR Preview Studio", "See a live silhouette preview before production."],
            ["White-Glove Delivery", "Timed drop-offs for bespoke orders in Nigeria."],
          ].map(([title, desc]) => (
            <div key={title}>
              <p className="text-gold font-serif text-sm">{title}</p>
              <p className="text-obsidian-300 font-sans text-xs mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-8xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="flex items-end justify-between mb-8 sm:mb-12">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-3xl sm:text-4xl text-obsidian"
          >
            The Edit
          </motion.h2>
          <Link href="/products" className="font-sans text-xs tracking-widest uppercase text-gold hover:text-obsidian transition-colors hidden sm:block">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
          {FEATURED_CATALOGUE.slice(0, 5).map((item, index) => (
            <CatalogueCard key={item.slug} item={item} index={index} />
          ))}
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Link href="/products" className="btn-ghost text-obsidian border-obsidian">
            View All Pieces
          </Link>
        </div>
      </section>

      <section className="bg-obsidian py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-sans text-xs tracking-[0.3em] uppercase text-gold mb-6"
          >
            Our Philosophy
          </motion.p>
          <motion.blockquote
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl sm:text-4xl text-ivory leading-snug mb-8"
          >
            "Every woman deserves a piece that was made{" "}
            <em className="text-gold">only for her.</em>"
          </motion.blockquote>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/ar-tryon" className="btn-primary">Try On a Piece</Link>
            <Link href="/about" className="btn-ghost text-ivory border-ivory hover:bg-ivory hover:text-obsidian">
              About the House
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
