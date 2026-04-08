import Image from "next/image";
import Link from "next/link";

const gallery = [
  "/catalogue/champagne-column-gown-editorial.jpg",
  "/catalogue/royal-amethyst-asoebi.jpg",
  "/catalogue/scarlet-command-suit-full.jpg",
];

export default function AboutPage() {
  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-20 sm:pb-24 space-y-16">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-end">
        <div className="space-y-6">
          <p className="font-sans text-xs tracking-[0.3em] uppercase text-gold">About DA Apparels</p>
          <h1 className="font-display text-5xl sm:text-6xl text-obsidian leading-none">
            Luxury fashion rooted in confidence, culture, and craft.
          </h1>
          <p className="max-w-2xl font-sans text-sm text-obsidian-500 leading-loose">
            DA Apparels creates expressive womenswear for clients who want every look to feel deliberate.
            From occasion gowns to aso ebi and tailored statement sets, each piece is designed to carry presence
            before it even enters the room.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/products" className="btn-primary">View the Collection</Link>
            <Link href="/bespoke" className="btn-ghost">Start Bespoke</Link>
          </div>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden bg-obsidian-50">
          <Image src="/catalogue/safari-sundress.jpg" alt="DA Apparels signature catalogue look" fill className="object-cover" />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {gallery.map((src) => (
          <div key={src} className="relative aspect-[3/4] overflow-hidden bg-obsidian-50">
            <Image src={src} alt="DA Apparels lookbook image" fill className="object-cover" />
          </div>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          ["Bespoke first", "Measurements, fit notes, and styling direction shape every final decision."],
          ["Event ready", "The collection is built for weddings, portraits, private dinners, and bold entrances."],
          ["Made in Nigeria", "The visual language stays proudly local while the finish feels globally premium."],
        ].map(([title, body]) => (
          <div key={title} className="border border-obsidian-100 p-6">
            <h2 className="font-serif text-2xl text-obsidian mb-3">{title}</h2>
            <p className="font-sans text-sm text-obsidian-500 leading-loose">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
