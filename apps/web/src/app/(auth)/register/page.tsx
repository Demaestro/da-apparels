"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { register as apiRegister } from "@/lib/api/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  firstName: z.string().min(2, "At least 2 characters."),
  lastName: z.string().min(2, "At least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z
    .string()
    .min(8, "Minimum 8 characters.")
    .regex(/[A-Z]/, "Must include an uppercase letter.")
    .regex(/[0-9]/, "Must include a number."),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const res = await apiRegister(values);
    if (!res.success) {
      setServerError(res.message ?? "Registration failed. Please try again.");
      return;
    }
    // If we got a token, go straight to vault
    if (res.data?.accessToken) {
      router.push("/account/vault");
      return;
    }
    // No token — Supabase sent a confirmation email
    setConfirmSent(true);
  }

  if (confirmSent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <div className="mb-6 mx-auto h-16 w-16 rounded-full bg-gold/10 flex items-center justify-center">
          <svg className="h-8 w-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>
        <p className="font-sans text-xs tracking-[0.3em] uppercase text-gold mb-4">Almost there</p>
        <h1 className="font-display text-4xl text-ivory mb-4">Check your inbox</h1>
        <p className="font-sans text-sm text-obsidian-400 leading-loose">
          We sent a confirmation link to your email. Click it to activate your account, then{" "}
          <Link href="/login" className="text-gold hover:underline">sign in here</Link>.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md"
    >
      <p className="font-sans text-xs tracking-[0.3em] uppercase text-gold mb-4">Join DA Apparels</p>
      <h1 className="font-display text-4xl text-ivory mb-2">Create account</h1>
      <p className="font-sans text-sm text-obsidian-400 mb-10">
        Save your measurements, track bespoke orders, and unlock personalised recommendations.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4 [&_input]:border-obsidian-600 [&_input]:text-ivory [&_input]:focus:border-gold [&_label]:text-obsidian-300">
          <Input label="First name" id="firstName" {...register("firstName")} error={errors.firstName?.message} />
          <Input label="Last name" id="lastName" {...register("lastName")} error={errors.lastName?.message} />
        </div>
        <div className="[&_input]:border-obsidian-600 [&_input]:text-ivory [&_input]:focus:border-gold [&_label]:text-obsidian-300">
          <Input label="Email address" type="email" id="email" {...register("email")} error={errors.email?.message} />
          <div className="mt-4">
            <Input label="Password" type="password" id="password" {...register("password")} error={errors.password?.message} />
          </div>
        </div>

        {serverError && (
          <p className="font-sans text-xs text-error bg-error/10 border border-error/20 px-4 py-3">
            {serverError}
          </p>
        )}

        <Button type="submit" loading={isSubmitting} variant="gold" className="w-full mt-2">
          Create Account
        </Button>
      </form>

      <p className="mt-8 text-center font-sans text-xs text-obsidian-400">
        Already have an account?{" "}
        <Link href="/login" className="text-gold hover:text-gold-light transition-colors">Sign in</Link>
      </p>
    </motion.div>
  );
}
