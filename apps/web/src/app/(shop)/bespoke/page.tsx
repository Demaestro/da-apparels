import Image from "next/image";
import Link from "next/link";

export default function BespokePage() {
  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-20 sm:pb-24 space-y-16">
      <section className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] items-center">
        <div className="relative aspect-[4/5] overflow-hidden bg-obsidian-50">
          <Image src="/catalogue/champagne-column-gown-front.jpg" alt="Bespoke DA Apparels gown" fill className="object-cover" />
        </div>
        <div className="space-y-6">
          <p className="font-sans text-xs tracking-[0.3em] uppercase text-gold">Bespoke</p>
          <h1 className="font-display text-5xl sm:text-6xl text-obsidian leading-none">
            Commission a piece that is cut for you, not the rack.
          </h1>
          <p className="font-sans text-sm text-obsidian-500 leading-loose max-w-2xl">
            Our bespoke process starts with your measurements, your event, and your desired mood. We guide silhouette,
            fabric, colour direction, and finishing details until the final piece feels unmistakably yours.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/account/vault" className="btn-primary">Save Measurements</Link>
            <a
              href="https://wa.me/2348146018669?text=Hello%2C%20I%20would%20like%20to%20start%20a%20bespoke%20DA%20Apparels%20order."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          ["1. Direction", "We define the event, fit intent, and visual reference points for the look."],
          ["2. Fit", "Measurements are stored securely in your vault so your pattern can be shaped accurately."],
          ["3. Finish", "Fabric selection, embellishment, delivery timing, and final styling are confirmed before production."],
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
