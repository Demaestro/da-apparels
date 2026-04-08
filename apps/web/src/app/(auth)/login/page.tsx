"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { login } from "@/lib/api/auth";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth.store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(1, "Password is required."),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const res = await login(values.email, values.password);
    if (!res.success) {
      setServerError(res.message ?? "Invalid credentials.");
      return;
    }

    // Try to load user profile from API; fall back to Supabase session data
    const meRes = await api.get<{ id: string; email: string; role: string; profile: { firstName: string; lastName: string } }>("/users/me");
    if (meRes.success && meRes.data) {
      setUser(meRes.data);
    } else {
      // Backend not yet deployed — build a minimal user object from Supabase session
      const { supabase } = await import("@/lib/supabase/client");
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email ?? values.email,
          role: "CLIENT",
          profile: {
            firstName: data.user.user_metadata?.firstName ?? "",
            lastName: data.user.user_metadata?.lastName ?? "",
          },
        });
      }
    }

    router.push("/");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md"
    >
      <p className="font-sans text-xs tracking-[0.3em] uppercase text-gold mb-4">Welcome back</p>
      <h1 className="font-display text-4xl text-ivory mb-10">Sign in</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Override base styles for dark bg */}
        <div className="[&_input]:border-obsidian-600 [&_input]:text-ivory [&_input]:focus:border-gold [&_label]:text-obsidian-300">
          <Input label="Email address" type="email" id="email" {...register("email")} error={errors.email?.message} />
        </div>
        <div className="[&_input]:border-obsidian-600 [&_input]:text-ivory [&_input]:focus:border-gold [&_label]:text-obsidian-300">
          <Input label="Password" type="password" id="password" {...register("password")} error={errors.password?.message} />
        </div>

        {serverError && (
          <p className="font-sans text-xs text-error bg-error/10 border border-error/20 px-4 py-3">
            {serverError}
          </p>
        )}

        <Button type="submit" loading={isSubmitting} variant="gold" className="w-full mt-2">
          Sign in
        </Button>
      </form>

      <div className="mt-8 space-y-3 text-center font-sans text-xs text-obsidian-400">
        <p>
          <Link href="/auth/forgot-password" className="hover:text-gold transition-colors">
            Forgot your password?
          </Link>
        </p>
        <p>
          Don't have an account?{" "}
          <Link href="/register" className="text-gold hover:text-gold-light transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
