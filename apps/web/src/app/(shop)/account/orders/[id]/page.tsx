"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOrder } from "@/lib/api/orders";
import { OrderStatusBadge } from "@/components/ui/badge";

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency === "NGN" ? "NGN" : currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function AccountOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["order", params.id],
    queryFn: () => fetchOrder(params.id),
  });

  const order = data?.data;

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

      <section className="border border-obsidian-100 p-6 space-y-4">
        <h2 className="font-serif text-2xl text-obsidian">Items</h2>
        <div className="space-y-3">
          {order.items.map((item, index) => (
            <div key={`${item.productId}-${index}`} className="flex items-start justify-between gap-4 border-b border-obsidian-50 pb-3">
              <div>
                <p className="font-serif text-sm text-obsidian">{item.productName}</p>
                <p className="font-sans text-xs text-obsidian-400">
                  {item.variantLabel ?? "Custom sizing"} • Qty {item.quantity}
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
            <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
            <p>{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
            <p>{order.shippingAddress.city}, {order.shippingAddress.country}</p>
            <p>{order.shippingAddress.phone}</p>
          </div>
          {order.payment && (
            <p className="font-sans text-xs text-obsidian-400 uppercase tracking-widest">
              Payment: {order.payment.status}
            </p>
          )}
        </div>

        <div className="border border-obsidian-100 p-6 space-y-4">
          <h2 className="font-serif text-2xl text-obsidian">Timeline</h2>
          <div className="space-y-4">
            {order.timeline.map((entry, index) => (
              <div key={`${entry.status}-${entry.createdAt}-${index}`} className="grid grid-cols-[20px_1fr] gap-3">
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
    </div>
  );
}
