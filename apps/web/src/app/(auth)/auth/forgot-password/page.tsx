"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    await api.post("/auth/forgot-password", values, { skipAuth: true });
    setSent(true);
  }

  return (
    <div className="w-full max-w-md">
      <p className="font-sans text-xs tracking-[0.3em] uppercase text-gold mb-4">Password recovery</p>
      <h1 className="font-display text-4xl text-ivory mb-3">Reset your password</h1>
      <p className="font-sans text-sm text-obsidian-400 mb-10">
        Enter the email attached to your account and we will send you a secure reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 [&_input]:border-obsidian-600 [&_input]:text-ivory [&_input]:focus:border-gold [&_label]:text-obsidian-300">
        <Input label="Email address" type="email" id="email" {...register("email")} error={errors.email?.message} />
        <Button type="submit" loading={isSubmitting} variant="gold" className="w-full">
          Send reset link
        </Button>
      </form>

      {sent && (
        <p className="mt-6 font-sans text-xs text-gold">
          If that address exists in our records, a reset link is on its way.
        </p>
      )}
    </div>
  );
}
