"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchMyOrders } from "@/lib/api/orders";
import { OrderStatusBadge } from "@/components/ui/badge";
import { motion } from "framer-motion";

function formatPrice(amount: string, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency === "NGN" ? "NGN" : currency,
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => fetchMyOrders(1),
  });

  const orders = data?.data?.orders ?? [];

  return (
    <div>
      <h1 className="font-display text-4xl text-obsidian mb-10">My Orders</h1>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 skeleton" />
          ))}
        </div>
      ) : !orders.length ? (
        <div className="py-16 text-center">
          <p className="font-serif text-2xl text-obsidian-400 mb-4">No orders yet.</p>
          <Link href="/products" className="btn-primary">Browse the Collection</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                href={`/account/orders/${order.id}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-obsidian-100 hover:border-gold/40 p-5 transition-colors duration-200"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <p className="font-sans text-sm font-medium text-obsidian">{order.orderNumber}</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="font-sans text-xs text-obsidian-400">
                    {order.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                  </p>
                  <p className="font-sans text-xs text-obsidian-300">
                    {new Date(order.createdAt).toLocaleDateString("en-NG", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-sans text-sm text-obsidian font-medium">
                    {formatPrice(order.totalAmount, order.currency)}
                  </p>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-obsidian-300 group-hover:text-gold transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
