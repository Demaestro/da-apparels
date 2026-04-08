"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOrder, submitManualPaymentProof } from "@/lib/api/orders";
import { OrderStatusBadge } from "@/components/ui/badge";
import { ProductReviews } from "@/components/reviews/product-reviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency === "NGN" ? "NGN" : currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export default function AccountOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const queryClient = useQueryClient();
  const [transferReference, setTransferReference] = useState("");
  const [senderName, setSenderName] = useState("");
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["order", params.id],
    queryFn: () => fetchOrder(params.id),
  });

  const order = data?.data;
  const paymentMetadata = useMemo(
    () => readRecord(order?.payment?.metadata),
    [order?.payment?.metadata],
  );
  const manualProof = readRecord(paymentMetadata?.manualProof);
  const bankName = readString(paymentMetadata?.bankName) ?? "KUDA MICROFINANCE BANK";
  const accountName =
    readString(paymentMetadata?.accountName) ?? "UCHE-OBILOR PRAISE AMARACHUKWU";
  const accountNumber = readString(paymentMetadata?.accountNumber) ?? "2006761840";
  const supportEmail =
    readString(paymentMetadata?.contactEmail) ??
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ??
    "mastaprazy@gmail.com";
  const contactWhatsApp = readString(paymentMetadata?.contactWhatsApp);
  const manualMode = order?.payment?.provider === "manual";
  const transferAlreadySubmitted = Boolean(readString(manualProof?.submittedAt));

  useEffect(() => {
    if (!order) {
      return;
    }

    setTransferReference((current) => {
      if (current) {
        return current;
      }

      return (
        readString(manualProof?.transferReference) ??
        readString(paymentMetadata?.transferReference) ??
        order.orderNumber
      );
    });

    setSenderName((current) => current || readString(manualProof?.senderName) || "");
    setNotes((current) => current || readString(manualProof?.notes) || "");
  }, [manualProof?.notes, manualProof?.senderName, manualProof?.transferReference, order, paymentMetadata?.transferReference]);

  const submitProof = useMutation({
    mutationFn: () =>
      submitManualPaymentProof(params.id, {
        transferReference,
        senderName: senderName || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", params.id] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-56 skeleton" />
        <div className="h-40 skeleton" />
        <div className="h-52 skeleton" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-16">
        <h1 className="font-display text-4xl text-obsidian mb-4">Order not found.</h1>
        <p className="font-sans text-sm text-obsidian-400">
          We could not load this order yet. Please try again shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-sans text-xs tracking-widest uppercase text-gold mb-2">Order Detail</p>
          <h1 className="font-display text-4xl text-obsidian">{order.orderNumber}</h1>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {manualMode && order.payment?.status !== "success" && (
        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="border border-gold/20 bg-gold/5 p-6 space-y-4">
            <div>
              <p className="font-sans text-xs tracking-widest uppercase text-gold mb-2">
                Bank Transfer
              </p>
              <h2 className="font-serif text-2xl text-obsidian">Complete payment securely</h2>
            </div>

            <div className="space-y-3 font-sans text-sm text-obsidian-500">
              <p>
                <span className="font-medium text-obsidian">Bank name:</span> {bankName}
              </p>
              <p>
                <span className="font-medium text-obsidian">Account name:</span> {accountName}
              </p>
              <p>
                <span className="font-medium text-obsidian">Account number:</span> {accountNumber}
              </p>
              <p>
                <span className="font-medium text-obsidian">Payment reference:</span>{" "}
                {transferReference || order.orderNumber}
              </p>
            </div>

            <p className="font-sans text-xs text-obsidian-400 leading-loose">
              Use your order number as the transfer reference. Once you have sent the transfer,
              submit the note on the right so our team can confirm it faster.
            </p>

            {transferAlreadySubmitted && (
              <div className="border border-gold/20 bg-white px-4 py-3">
                <p className="font-sans text-xs tracking-widest uppercase text-gold mb-1">
                  Transfer Submitted
                </p>
                <p className="font-sans text-sm text-obsidian-500">
                  We recorded your transfer note on{" "}
                  {new Date(readString(manualProof?.submittedAt) ?? "").toLocaleString("en-NG")}.
                </p>
              </div>
            )}
          </div>

          <div className="border border-obsidian-100 p-6 space-y-4">
            <div>
              <p className="font-sans text-xs tracking-widest uppercase text-gold mb-2">
                Payment Confirmation
              </p>
              <h2 className="font-serif text-2xl text-obsidian">Tell us once you have paid</h2>
            </div>

            <Input
              id="transferReference"
              label="Transfer reference"
              value={transferReference}
              onChange={(event) => setTransferReference(event.target.value)}
              placeholder={order.orderNumber}
            />
            <Input
              id="senderName"
              label="Sender name (optional)"
              value={senderName}
              onChange={(event) => setSenderName(event.target.value)}
              placeholder="Name on the transfer"
            />
            <div className="space-y-1.5">
              <label
                htmlFor="paymentNotes"
                className="font-sans text-xs tracking-widest uppercase text-obsidian-400"
              >
                Notes (optional)
              </label>
              <textarea
                id="paymentNotes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Bank used, transfer time, or any other helpful note."
                className="w-full border border-obsidian-200 bg-transparent px-4 py-3 font-sans text-sm text-obsidian placeholder:text-obsidian-300 focus:outline-none focus:border-obsidian transition-colors resize-none"
              />
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={() => submitProof.mutate()}
              loading={submitProof.isPending}
              disabled={!transferReference.trim()}
            >
              I've Sent Payment
            </Button>

            {submitProof.isSuccess && (
              <p className="font-sans text-xs text-gold">
                Payment note recorded. Our team will review your transfer shortly.
              </p>
            )}

            {submitProof.isError && (
              <p className="font-sans text-xs text-error">
                We could not record your transfer note just now. Please try again.
              </p>
            )}

            <div className="font-sans text-xs text-obsidian-400 leading-loose">
              <p>
                Support email:{" "}
                <a href={`mailto:${supportEmail}`} className="text-obsidian underline underline-offset-4">
                  {supportEmail}
                </a>
              </p>
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
          </div>
        </section>
      )}

      <section className="border border-obsidian-100 p-6 space-y-4">
        <h2 className="font-serif text-2xl text-obsidian">Items</h2>
        <div className="space-y-3">
          {order.items.map((item, index) => (
            <div
              key={`${item.productId}-${index}`}
              className="flex items-start justify-between gap-4 border-b border-obsidian-50 pb-3"
            >
              <div>
                <p className="font-serif text-sm text-obsidian">{item.productName}</p>
                <p className="font-sans text-xs text-obsidian-400">
                  {item.variantLabel ?? item.sku ?? "Custom sizing"} • Qty {item.quantity}
                </p>
              </div>
              <p className="font-sans text-sm text-obsidian">
                {formatPrice(item.unitPrice * item.quantity, item.currency)}
              </p>
            </div>
          ))}
        </div>
        <p className="font-sans text-sm text-obsidian font-medium">
          Total: {formatPrice(Number(order.totalAmount), order.items[0]?.currency ?? "NGN")}
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="border border-obsidian-100 p-6 space-y-4">
          <h2 className="font-serif text-2xl text-obsidian">Delivery</h2>
          <div className="font-sans text-sm text-obsidian-500 leading-loose">
            <p>
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </p>
            <p>{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.country}
            </p>
            <p>{order.shippingAddress.phone}</p>
          </div>
          {order.payment && (
            <div className="space-y-1 font-sans text-xs uppercase tracking-widest text-obsidian-400">
              <p>Payment provider: {order.payment.provider}</p>
              <p>Payment status: {order.payment.status}</p>
            </div>
          )}
        </div>

        <div className="border border-obsidian-100 p-6 space-y-4">
          <h2 className="font-serif text-2xl text-obsidian">Timeline</h2>
          <div className="space-y-4">
            {order.timeline.map((entry, index) => (
              <div
                key={`${entry.status}-${entry.createdAt}-${index}`}
                className="grid grid-cols-[20px_1fr] gap-3"
              >
                <div className="pt-1">
                  <div className="h-3 w-3 rounded-full bg-gold" />
                </div>
                <div>
                  <p className="font-sans text-xs tracking-widest uppercase text-gold">
                    {entry.status.replace(/_/g, " ")}
                  </p>
                  <p className="font-sans text-sm text-obsidian-500">
                    {new Date(entry.createdAt).toLocaleString("en-NG")}
                  </p>
                  {entry.note && (
                    <p className="font-sans text-sm text-obsidian mt-1">{entry.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/products" className="btn-ghost">
          Continue Shopping
        </Link>
        <Link href="/account/orders" className="btn-ghost">
          Back to Orders
        </Link>
      </div>

      {order.status === "DELIVERED" && order.items.length > 0 && (
        <section className="border-t border-obsidian-100 pt-10 space-y-10">
          <h2 className="font-display text-2xl text-obsidian">Review Your Pieces</h2>
          {order.items.map((item, index) => (
            <ProductReviews
              key={`${item.productId}-${index}`}
              productId={item.productId}
              productName={item.productName}
              orderId={order.id}
              allowReview
            />
          ))}
        </section>
      )}
    </div>
  );
}
