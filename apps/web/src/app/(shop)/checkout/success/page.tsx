import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order Confirmed" };

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 pt-48 pb-24 text-center">
      <p className="text-gold font-sans text-xs tracking-[0.3em] uppercase mb-6">Order Confirmed</p>
      <h1 className="font-display text-5xl text-obsidian mb-6 leading-tight">
        Thank you for your order.
      </h1>
      <p className="font-sans text-sm text-obsidian-400 leading-loose mb-12">
        Your bespoke piece is now in the hands of our artisans.
        You will receive an email confirmation shortly, and we'll keep you updated at every stage of production.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/account/orders" className="btn-primary">Track My Order</Link>
        <Link href="/products" className="btn-ghost">Continue Shopping</Link>
      </div>
    </div>
  );
}
