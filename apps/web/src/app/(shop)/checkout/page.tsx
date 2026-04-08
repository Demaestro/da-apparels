"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useCartStore } from "@/lib/store/cart.store";
import { createOrder, initiatePayment } from "@/lib/api/orders";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(8),
  addressLine1: z.string().min(5),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  country: z.string().default("NG"),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency === "NGN" ? "NGN" : currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function CheckoutPage() {
  const { items, total, clear } = useCartStore();
  const [step, setStep] = useState<"address" | "review" | "processing">("address");
  const [error, setError] = useState<string | null>(null);
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "mastaprazy@gmail.com";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const orderTotal = total();
  const shippingFee = 2500;
  const currency = items[0]?.currency ?? "NGN";

  async function onSubmit(values: FormValues) {
    setStep("processing");
    setError(null);

    try {
      const orderRes = await createOrder(
        items,
        {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          addressLine1: values.addressLine1,
          addressLine2: values.addressLine2,
          city: values.city,
          country: values.country,
          postalCode: values.postalCode,
        },
        values.notes,
      );

      if (!orderRes.success || !orderRes.data) {
        setError(orderRes.message ?? "Failed to place order.");
        setStep("review");
        return;
      }

      const payRes = await initiatePayment(orderRes.data.id);
      if (!payRes.success || !payRes.data) {
        setError(payRes.message ?? "We could not prepare the next step for your order.");
        setStep("review");
        return;
      }

      clear();

      if (payRes.data.flow === "redirect") {
        window.location.href = payRes.data.authorizationUrl;
        return;
      }

      // Store sensitive payment details in sessionStorage — NOT in the URL.
      // sessionStorage is tab-scoped, never appears in server logs or browser history,
      // and is cleared when the tab closes.
      sessionStorage.setItem(
        "da_payment_details",
        JSON.stringify({
          mode: "manual",
          order: orderRes.data.orderNumber,
          orderId: orderRes.data.id,
          bankName: payRes.data.bankName,
          accountName: payRes.data.accountName,
          accountNumber: payRes.data.accountNumber,
          transferReference: payRes.data.transferReference,
          contactEmail: payRes.data.contactEmail ?? "",
          contactWhatsApp: payRes.data.contactWhatsApp ?? "",
        }),
      );

      window.location.href = "/checkout/success";
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("review");
    }
  }

  if (!items.length) {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-36 pb-24 text-center">
        <p className="font-display text-3xl text-obsidian-400">Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 pt-36 pb-24">
      <p className="font-sans text-xs tracking-[0.3em] uppercase text-gold mb-4">Checkout</p>
      <h1 className="font-display text-4xl text-obsidian mb-12">Complete Your Order</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16">
        <form onSubmit={handleSubmit(() => setStep("review"))} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First name" {...register("firstName")} error={errors.firstName?.message} />
            <Input label="Last name" {...register("lastName")} error={errors.lastName?.message} />
          </div>
          <Input label="Phone" type="tel" {...register("phone")} error={errors.phone?.message} />
          <Input label="Address" {...register("addressLine1")} error={errors.addressLine1?.message} />
          <Input label="Apartment / Floor (optional)" {...register("addressLine2")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" {...register("city")} error={errors.city?.message} />
            <Input label="Country" {...register("country")} defaultValue="NG" />
          </div>
          <div>
            <label className="font-sans text-xs tracking-widest uppercase text-obsidian-400 block mb-1.5">
              Special notes (optional)
            </label>
            <textarea
              {...register("notes")}
              rows={3}
              className="w-full border border-obsidian-200 bg-transparent px-4 py-3 font-sans text-sm text-obsidian placeholder:text-obsidian-300 focus:outline-none focus:border-obsidian transition-colors resize-none"
              placeholder="e.g. Leave at reception..."
            />
          </div>

          {step === "address" && (
            <Button type="submit" size="lg" className="w-full">
              Continue to Review
            </Button>
          )}
        </form>

        <div className="space-y-6">
          <div className="border border-gold/20 p-6 space-y-4">
            <p className="font-sans text-xs tracking-widest uppercase text-gold">Order Summary</p>

            {items.map((item, index) => (
              <div key={index} className="flex justify-between gap-4 text-sm">
                <div>
                  <p className="font-serif text-obsidian">{item.productName}</p>
                  <p className="font-sans text-xs text-obsidian-400">
                    {[item.variantLabel, item.fabricName].filter(Boolean).join(" - ")} x {item.quantity}
                  </p>
                </div>
                <p className="font-sans text-obsidian shrink-0">
                  {formatPrice(item.unitPrice * item.quantity, item.currency)}
                </p>
              </div>
            ))}

            <div className="divider-gold" />

            <div className="space-y-1.5 font-sans text-sm">
              <div className="flex justify-between text-obsidian-400">
                <span>Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
                <span>{formatPrice(orderTotal, currency)}</span>
              </div>
              <div className="flex justify-between text-obsidian-400">
                <span>Shipping</span>
                <span>{formatPrice(shippingFee, "NGN")}</span>
              </div>
              <div className="flex justify-between font-medium text-obsidian text-base pt-2 border-t border-gold/20">
                <span>Total</span>
                <span>{formatPrice(orderTotal + shippingFee, currency)}</span>
              </div>
            </div>
          </div>

          {error && (
            <p className="font-sans text-xs text-error bg-error/5 border border-error/20 px-4 py-3">
              {error}
            </p>
          )}

          {step === "review" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Button size="lg" className="w-full" onClick={handleSubmit(onSubmit)} loading={false}>
                Complete Order
              </Button>
              <p className="font-sans text-xs text-obsidian-400 text-center mt-3">
                Paystack checkout opens when online payment is available. Otherwise we reserve your order and show your bank transfer details instantly, with support from {supportEmail}.
              </p>
            </motion.div>
          )}

          {step === "processing" && (
            <div className="text-center py-6 space-y-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent mx-auto" />
              <p className="font-sans text-xs text-obsidian-400">
                Preparing the next step for your order...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
