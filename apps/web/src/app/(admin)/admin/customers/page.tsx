"use client";

import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Input } from "@/components/ui/input";

interface Customer {
  id: string;
  email: string;
  createdAt: string;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string | null;
    city?: string | null;
  } | null;
  _count: { orders: number };
  totalSpend?: number;
}

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-customers", deferredSearch],
    queryFn: () =>
      api.get<{ customers: Customer[]; meta: { total: number } }>(
        `/admin/crm/customers?limit=50${deferredSearch ? `&search=${encodeURIComponent(deferredSearch)}` : ""}`,
      ),
  });

  const customers = data?.data?.customers ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 font-sans text-xs tracking-widest uppercase text-gold">Admin</p>
          <h1 className="font-display text-3xl text-obsidian">Customers</h1>
        </div>
        <div className="w-full sm:w-80">
          <Input
            label="Search customers"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Email or name"
          />
        </div>
      </div>

      <div className="overflow-hidden border border-obsidian-100 bg-white">
        <table className="w-full font-sans text-xs">
          <thead className="border-b border-obsidian-100 bg-obsidian-50">
            <tr>
              {["Customer", "Email", "City", "Orders", "Joined"].map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left font-normal tracking-widest uppercase text-obsidian-400"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index} className="border-b border-obsidian-50">
                    {Array.from({ length: 5 }).map((__, cell) => (
                      <td key={cell} className="px-4 py-3">
                        <div className="h-4 skeleton" />
                      </td>
                    ))}
                  </tr>
                ))
              : customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-obsidian-50">
                    <td className="px-4 py-3 text-obsidian">
                      {customer.profile
                        ? `${customer.profile.firstName} ${customer.profile.lastName}`
                        : "Unnamed customer"}
                    </td>
                    <td className="px-4 py-3 text-obsidian-400">{customer.email}</td>
                    <td className="px-4 py-3 text-obsidian-400">
                      {customer.profile?.city ?? "Not set"}
                    </td>
                    <td className="px-4 py-3 text-obsidian-400">{customer._count.orders}</td>
                    <td className="px-4 py-3 text-obsidian-400">
                      {new Date(customer.createdAt).toLocaleDateString("en-NG")}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
