"use client";

/**
 * Checkout success page.
 *
 * For manual (bank transfer) orders: payment details are read from sessionStorage,
 * never from URL query params. This keeps bank account numbers out of server logs,
 * browser history, and referrer headers.
 */

import { useEffect, useState } from "react";
import Link from "next/link";

interface ManualPaymentDetails {
  mode: "manual";
  order: string;
  orderId: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  transferReference: string;
  contactEmail: string;
  contactWhatsApp: string;
}

export default function CheckoutSuccessPage() {
  const [details, setDetails] = useState<ManualPaymentDetails | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("da_payment_details");
      if (raw) {
        const parsed = JSON.parse(raw) as ManualPaymentDetails;
        setDetails(parsed);
        // Consume once — prevents showing stale details on a second visit
        sessionStorage.removeItem("da_payment_details");
      }
    } catch {
      // ignore parse errors
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  const isManual = details?.mode === "manual";
  const supportEmail = details?.contactEmail || process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "";
  const contactWhatsApp = details?.contactWhatsApp || "";

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
          ? `Order ${details.order} is waiting for manual payment confirmation. Please make your bank transfer using the details below, then send your payment proof to ${supportEmail}.`
          : "Your bespoke piece is now in the hands of our artisans. You will receive an email confirmation shortly, and we'll keep you updated at every stage of production."}
      </p>

      {isManual && details && (
        <div className="mb-10 space-y-6">
          <div className="border border-gold/20 bg-cream/40 p-6 text-left">
            <p className="text-gold font-sans text-[11px] tracking-[0.28em] uppercase mb-4">
              Bank Transfer Details
            </p>
            <div className="space-y-3 font-sans text-sm text-obsidian-400">
              <p>
                <span className="text-obsidian font-medium">Bank name:</span> {details.bankName}
              </p>
              <p>
                <span className="text-obsidian font-medium">Account name:</span>{" "}
                {details.accountName}
              </p>
              <p>
                <span className="text-obsidian font-medium">Account number:</span>{" "}
                {details.accountNumber}
              </p>
              <p>
                <span className="text-obsidian font-medium">Payment reference:</span>{" "}
                {details.transferReference}
              </p>
            </div>
          </div>

          {(supportEmail || contactWhatsApp) && (
            <div className="space-y-2 font-sans text-sm text-obsidian-400">
              {supportEmail && (
                <p>
                  Email:{" "}
                  <a
                    href={`mailto:${supportEmail}`}
                    className="text-obsidian underline underline-offset-4"
                  >
                    {supportEmail}
                  </a>
                </p>
              )}
              {contactWhatsApp && (
                <p>
                  WhatsApp:{" "}
                  <a
                    href={`https://wa.me/${contactWhatsApp}`}
                    className="text-obsidian underline underline-offset-4"
                  >
                    {contactWhatsApp}
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href={details?.orderId ? `/account/orders/${details.orderId}` : "/account/orders"}
          className="btn-primary"
        >
          Track My Order
        </Link>
        <Link href="/products" className="btn-ghost">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
