"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { BodyMeasurements } from "@da-apparels/types";

const schema = z.object({
  chest: z.coerce.number().positive().max(200),
  waist: z.coerce.number().positive().max(200),
  hips: z.coerce.number().positive().max(200),
  inseam: z.coerce.number().positive().max(120),
  shoulder: z.coerce.number().positive().max(80),
  sleeveLength: z.coerce.number().positive().max(100),
  height: z.coerce.number().min(100).max(250),
  weight: z.coerce.number().min(20).max(300),
  notes: z.string().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

const FIELDS: { key: keyof FormValues; label: string; unit: string }[] = [
  { key: "chest", label: "Chest", unit: "cm" },
  { key: "waist", label: "Waist", unit: "cm" },
  { key: "hips", label: "Hips", unit: "cm" },
  { key: "inseam", label: "Inseam", unit: "cm" },
  { key: "shoulder", label: "Shoulder width", unit: "cm" },
  { key: "sleeveLength", label: "Sleeve length", unit: "cm" },
  { key: "height", label: "Height", unit: "cm" },
  { key: "weight", label: "Weight", unit: "kg" },
];

export default function VaultPage() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["measurements"],
    queryFn: () => api.get<BodyMeasurements>("/users/me/measurements"),
  });

  const measurements = existing?.data;

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: measurements as FormValues | undefined,
  });

  const save = useMutation({
    mutationFn: (data: FormValues) => api.put("/users/me/measurements", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["measurements"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  return (
    <div>
      <h1 className="font-display text-4xl text-obsidian mb-2">My Vault</h1>
      <p className="font-sans text-sm text-obsidian-400 mb-10 max-w-lg">
        Your measurements are encrypted with AES-256 and stored securely. They are used to ensure
        your bespoke pieces fit perfectly and are never shared with third parties.
      </p>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 skeleton" />
          ))}
        </div>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit((data) => save.mutate(data))}
          className="space-y-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FIELDS.map(({ key, label, unit }) => (
              <div key={key}>
                <Input
                  label={`${label} (${unit})`}
                  type="number"
                  step="0.5"
                  id={key}
                  {...register(key)}
                  error={errors[key]?.message}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="font-sans text-xs tracking-widest uppercase text-obsidian-400 block mb-1.5">
              Notes (optional)
            </label>
            <textarea
              {...register("notes")}
              rows={3}
              placeholder="e.g. Prefer extra room in the chest…"
              className="w-full border border-obsidian-200 bg-transparent px-4 py-3 font-sans text-sm text-obsidian placeholder:text-obsidian-300 focus:outline-none focus:border-obsidian transition-colors resize-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <Button type="submit" loading={save.isPending}>
              {measurements ? "Update Measurements" : "Save Measurements"}
            </Button>
            {saved && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-sans text-xs text-gold"
              >
                Saved securely.
              </motion.p>
            )}
            {save.isError && (
              <p className="font-sans text-xs text-error">Failed to save. Please try again.</p>
            )}
          </div>

          {/* Security note */}
          <div className="border border-gold/20 bg-gold/5 px-5 py-4 max-w-lg">
            <p className="font-sans text-xs text-obsidian-500 leading-loose">
              <span className="text-gold font-medium">AES-256-GCM encrypted.</span>{" "}
              Your measurements are encrypted before being stored. Not even our team can read them
              — they are decrypted only when you request them.
            </p>
          </div>
        </motion.form>
      )}
    </div>
  );
}
