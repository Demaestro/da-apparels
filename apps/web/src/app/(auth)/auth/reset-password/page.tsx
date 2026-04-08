import { Suspense } from "react";
import ResetPasswordForm from "./reset-password-form";

function ResetPasswordFallback() {
  return (
    <div className="w-full max-w-md">
      <p className="mb-4 font-sans text-xs tracking-[0.3em] uppercase text-gold">
        Create a new password
      </p>
      <h1 className="mb-10 font-display text-4xl text-ivory">Set a fresh password</h1>
      <div className="space-y-4">
        <div className="h-12 skeleton" />
        <div className="h-12 skeleton" />
        <div className="h-12 skeleton" />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
