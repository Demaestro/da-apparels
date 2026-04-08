"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

interface FabricRow {
  name: string;
  category: string;
  timesSelected: number;
}

export default function AdminFabricPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-fabric"],
    queryFn: () => api.get<FabricRow[]>("/admin/fabric-tracking"),
  });

  const rows = data?.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <p className="font-sans text-xs tracking-widest uppercase text-gold mb-1">Admin</p>
        <h1 className="font-display text-3xl text-obsidian">Fabric Tracking</h1>
      </div>

      <div className="border border-obsidian-100 bg-white p-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-8 skeleton" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => {
              const max = rows[0]?.timesSelected ?? 1;
              const width = `${(row.timesSelected / max) * 100}%`;
              return (
                <div key={`${row.name}-${row.category}`}>
                  <div className="mb-1 flex justify-between font-sans text-xs">
                    <span className="text-obsidian">{row.name}</span>
                    <span className="text-obsidian-400">{row.timesSelected}×</span>
                  </div>
                  <div className="h-2 bg-obsidian-100">
                    <div className="h-full bg-gold" style={{ width }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
