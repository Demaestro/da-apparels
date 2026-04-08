"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/lib/api/client";

interface Analytics {
  period: string;
  revenue: { total: number; currency: string };
  orders: { total: number; byStatus: { status: string; count: number }[]; aov: number };
  customers: { newInPeriod: number };
  topProducts: { productName: string; unitsSold: number; revenue: number }[];
  fabricTracking: { name: string; category: string; timesSelected: number }[];
}

type Period = "7d" | "30d" | "90d" | "all";
const PERIODS: Period[] = ["7d", "30d", "90d", "all"];

function formatNGN(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<Period>("30d");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics", period],
    queryFn: () => api.get<Analytics>(`/admin/crm/analytics?period=${period}`),
  });

  const analytics = data?.data;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-sans text-xs tracking-widest uppercase text-gold mb-1">CRM Dashboard</p>
          <h1 className="font-display text-3xl text-obsidian">Analytics Overview</h1>
        </div>
        <div className="flex gap-1 border border-obsidian-200">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`font-sans text-xs tracking-widest uppercase px-4 py-2 transition-colors ${
                period === p ? "bg-obsidian text-gold" : "text-obsidian-400 hover:text-obsidian"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: analytics ? formatNGN(Number(analytics.revenue.total)) : "—",
          },
          {
            label: "Total Orders",
            value: analytics?.orders.total.toLocaleString() ?? "—",
          },
          {
            label: "Avg. Order Value",
            value: analytics ? formatNGN(analytics.orders.aov) : "—",
          },
          {
            label: "New Customers",
            value: analytics?.customers.newInPeriod.toLocaleString() ?? "—",
          },
        ].map(({ label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="border border-obsidian-100 bg-white p-6 space-y-2"
          >
            <p className="font-sans text-xs tracking-widest uppercase text-gold">{label}</p>
            <p className="font-display text-3xl text-obsidian">
              {isLoading ? <span className="skeleton h-8 w-24 block" /> : value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top products */}
        <div className="border border-obsidian-100 bg-white p-6">
          <p className="font-sans text-xs tracking-widest uppercase text-gold mb-6">Top Products</p>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 skeleton" />
              ))}
            </div>
          ) : analytics?.topProducts.length ? (
            <table className="w-full font-sans text-xs">
              <thead>
                <tr className="text-obsidian-400 border-b border-obsidian-100">
                  <th className="text-left pb-3 font-normal tracking-wider uppercase">Product</th>
                  <th className="text-right pb-3 font-normal tracking-wider uppercase">Units</th>
                  <th className="text-right pb-3 font-normal tracking-wider uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topProducts.map((p, i) => (
                  <tr key={i} className="border-b border-obsidian-50">
                    <td className="py-3 text-obsidian">{p.productName}</td>
                    <td className="py-3 text-right text-obsidian-400">{p.unitsSold}</td>
                    <td className="py-3 text-right text-obsidian">{formatNGN(Number(p.revenue))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-obsidian-400 text-xs">No orders in this period.</p>
          )}
        </div>

        {/* Fabric tracking */}
        <div className="border border-obsidian-100 bg-white p-6">
          <p className="font-sans text-xs tracking-widest uppercase text-gold mb-6">
            Fabric Selection Trends
          </p>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 skeleton" />
              ))}
            </div>
          ) : analytics?.fabricTracking.length ? (
            <div className="space-y-3">
              {analytics.fabricTracking.map((f, i) => {
                const max = analytics.fabricTracking[0].timesSelected;
                const pct = (f.timesSelected / max) * 100;
                return (
                  <div key={i}>
                    <div className="flex justify-between font-sans text-xs mb-1">
                      <span className="text-obsidian">{f.name}</span>
                      <span className="text-obsidian-400">{f.timesSelected}×</span>
                    </div>
                    <div className="h-1 bg-obsidian-100 w-full">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.05 }}
                        className="h-full bg-gold"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-obsidian-400 text-xs">No fabric selections recorded.</p>
          )}
        </div>
      </div>

      {/* Orders by status */}
      {analytics && (
        <div className="border border-obsidian-100 bg-white p-6">
          <p className="font-sans text-xs tracking-widest uppercase text-gold mb-6">
            Orders by Status
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-4">
            {analytics.orders.byStatus.map(({ status, count }) => (
              <div key={status} className="text-center">
                <p className="font-display text-2xl text-obsidian">{count}</p>
                <p className="font-sans text-[10px] text-obsidian-400 mt-1 leading-tight">
                  {status.replace(/_/g, " ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
