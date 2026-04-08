"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Minimum 8 characters.")
      .regex(/[A-Z]/, "Must include an uppercase letter.")
      .regex(/[0-9]/, "Must include a number."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const token = params.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    const response = await api.post<{ message: string }>(
      "/auth/reset-password",
      { token, newPassword: values.password },
      { skipAuth: true },
    );

    if (!response.success) {
      setError(response.message ?? "Reset link is invalid or has expired.");
      return;
    }

    router.push("/login");
  }

  return (
    <div className="w-full max-w-md">
      <p className="mb-4 font-sans text-xs tracking-[0.3em] uppercase text-gold">
        Create a new password
      </p>
      <h1 className="mb-10 font-display text-4xl text-ivory">Set a fresh password</h1>

      {!token ? (
        <p className="font-sans text-sm text-error">
          This reset link is incomplete. Request a new password reset email.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 [&_input]:border-obsidian-600 [&_input]:text-ivory [&_input]:focus:border-gold [&_label]:text-obsidian-300"
        >
          <Input
            label="New password"
            type="password"
            id="password"
            {...register("password")}
            error={errors.password?.message}
          />
          <Input
            label="Confirm password"
            type="password"
            id="confirmPassword"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />
          {error && (
            <p className="border border-error/20 bg-error/10 px-4 py-3 font-sans text-xs text-error">
              {error}
            </p>
          )}
          <Button type="submit" loading={isSubmitting} variant="gold" className="w-full">
            Update password
          </Button>
        </form>
      )}
    </div>
  );
}
