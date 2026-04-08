import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order Confirmed" };

type CheckoutSuccessPageProps = {
  searchParams?: {
    mode?: string;
    order?: string;
    contactEmail?: string;
    contactWhatsApp?: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    transferReference?: string;
  };
};

export default function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const isManual = searchParams?.mode === "manual";
  const orderNumber = searchParams?.order;
  const contactEmail =
    searchParams?.contactEmail ?? process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "mastaprazy@gmail.com";
  const contactWhatsApp = searchParams?.contactWhatsApp;
  const bankName =
    searchParams?.bankName ??
    process.env.NEXT_PUBLIC_MANUAL_PAYMENT_BANK_NAME ??
    "KUDA MICROFINANCE BANK";
  const accountName =
    searchParams?.accountName ??
    process.env.NEXT_PUBLIC_MANUAL_PAYMENT_ACCOUNT_NAME ??
    "UCHE-OBILOR PRAISE AMARACHUKWU";
  const accountNumber =
    searchParams?.accountNumber ??
    process.env.NEXT_PUBLIC_MANUAL_PAYMENT_ACCOUNT_NUMBER ??
    "2006761840";
  const transferReference = searchParams?.transferReference ?? orderNumber ?? "Your order number";

  return (
    <div className="max-w-2xl mx-auto px-6 pt-48 pb-24 text-center">
      <p className="text-gold font-sans text-xs tracking-[0.3em] uppercase mb-6">
        {isManual ? "Order Reserved" : "Order Confirmed"}
      </p>
      <h1 className="font-display text-5xl text-obsidian mb-6 leading-tight">
        {isManual ? "Your order has been reserved." : "Thank you for your order."}
      </h1>
      <p className="font-sans text-sm text-obsidian-400 leading-loose mb-12">
        {isManual
          ? `Order ${orderNumber ?? ""} is waiting for manual payment confirmation. Please make your bank transfer using the details below, then send your payment proof to ${contactEmail}.`
          : "Your bespoke piece is now in the hands of our artisans. You will receive an email confirmation shortly, and we'll keep you updated at every stage of production."}
      </p>
      {isManual && (
        <div className="mb-10 space-y-6">
          <div className="border border-gold/20 bg-cream/40 p-6 text-left">
            <p className="text-gold font-sans text-[11px] tracking-[0.28em] uppercase mb-4">
              Bank Transfer Details
            </p>
            <div className="space-y-3 font-sans text-sm text-obsidian-400">
              <p>
                <span className="text-obsidian font-medium">Bank name:</span> {bankName}
              </p>
              <p>
                <span className="text-obsidian font-medium">Account name:</span> {accountName}
              </p>
              <p>
                <span className="text-obsidian font-medium">Account number:</span> {accountNumber}
              </p>
              <p>
                <span className="text-obsidian font-medium">Payment reference:</span>{" "}
                {transferReference}
              </p>
            </div>
          </div>
          <div className="space-y-2 font-sans text-sm text-obsidian-400">
            <p>
              Email:{" "}
              <a href={`mailto:${contactEmail}`} className="text-obsidian underline underline-offset-4">
                {contactEmail}
              </a>
            </p>
            {contactWhatsApp && (
              <p>
                WhatsApp:{" "}
                <a href={`https://wa.me/${contactWhatsApp}`} className="text-obsidian underline underline-offset-4">
                  {contactWhatsApp}
                </a>
              </p>
            )}
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/account/orders" className="btn-primary">
          Track My Order
        </Link>
        <Link href="/products" className="btn-ghost">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
