"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/lib/api/client";
import { OrderStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ORDER_STATUSES = [
  "PENDING_PAYMENT", "PAYMENT_CONFIRMED", "IN_PRODUCTION",
  "QUALITY_CHECK", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED",
];

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  currency: string;
  productionDeadline: string | null;
  createdAt: string;
  user: { email: string; profile: { firstName: string; lastName: string } | null };
  _count: { items: number };
}

function formatPrice(amount: string, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: currency === "NGN" ? "NGN" : currency, minimumFractionDigits: 0,
  }).format(Number(amount));
}

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", filterStatus],
    queryFn: () => api.get<{ orders: AdminOrder[]; meta: { total: number } }>(
      `/admin/orders?limit=50${filterStatus ? `&status=${filterStatus}` : ""}`,
    ),
  });

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.patch(`/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      setSelectedOrderId(null);
    },
  });

  const orders = data?.data?.orders ?? [];

  return (
    <div className="space-y-8">
      <div>
        <p className="font-sans text-xs tracking-widest uppercase text-gold mb-1">Admin</p>
        <h1 className="font-display text-3xl text-obsidian">Orders</h1>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus(null)}
          className={`font-sans text-xs tracking-widest uppercase px-3 py-1.5 border transition-colors ${
            !filterStatus ? "bg-obsidian text-gold border-obsidian" : "border-obsidian-200 text-obsidian-400 hover:border-obsidian"
          }`}
        >
          All
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`font-sans text-xs tracking-widest uppercase px-3 py-1.5 border transition-colors ${
              filterStatus === s ? "bg-obsidian text-gold border-obsidian" : "border-obsidian-200 text-obsidian-400 hover:border-obsidian"
            }`}
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-white border border-obsidian-100 overflow-hidden">
        <table className="w-full font-sans text-xs">
          <thead className="border-b border-obsidian-100 bg-obsidian-50">
            <tr>
              {["Order", "Customer", "Status", "Items", "Total", "Date", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-normal tracking-widest uppercase text-obsidian-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-obsidian-50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 skeleton" /></td>
                    ))}
                  </tr>
                ))
              : orders.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-obsidian-50 hover:bg-gold/5 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-obsidian">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-obsidian-400">
                      {order.user.profile
                        ? `${order.user.profile.firstName} ${order.user.profile.lastName}`
                        : order.user.email}
                    </td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-obsidian-400">{order._count.items}</td>
                    <td className="px-4 py-3 text-obsidian">{formatPrice(order.totalAmount, order.currency)}</td>
                    <td className="px-4 py-3 text-obsidian-400">
                      {new Date(order.createdAt).toLocaleDateString("en-NG")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setSelectedOrderId(order.id); setNewStatus(order.status); }}
                        className="text-gold hover:text-gold-muted transition-colors text-xs tracking-widest uppercase"
                      >
                        Update
                      </button>
                    </td>
                  </motion.tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Status update modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 bg-obsidian/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 w-full max-w-sm space-y-6">
            <h2 className="font-display text-xl text-obsidian">Update Order Status</h2>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border border-obsidian-200 px-4 py-3 font-sans text-sm text-obsidian focus:outline-none focus:border-obsidian"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <Button
                onClick={() => updateStatus.mutate({ orderId: selectedOrderId, status: newStatus })}
                loading={updateStatus.isPending}
              >
                Save
              </Button>
              <Button variant="ghost" onClick={() => setSelectedOrderId(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
