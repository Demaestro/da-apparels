"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { submitReview, type ProductReview } from "@/lib/api/reviews";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(3, "Please add a short title.").max(80),
  body: z.string().min(10, "Please write at least 10 characters.").max(1000),
});
type FormValues = z.infer<typeof schema>;

interface ReviewFormProps {
  productId: string;
  productName: string;
  orderId?: string;
  onSuccess: (review: ProductReview) => void;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform duration-100 hover:scale-110"
        >
          <svg
            className={`h-7 w-7 transition-colors duration-100 ${
              star <= (hovered || value) ? "text-gold" : "text-obsidian-200"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function ReviewForm({ productId, productName, orderId, onSuccess }: ReviewFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rating: 0, title: "", body: "" },
  });

  const rating = watch("rating");

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const res = await submitReview({ productId, orderId, ...values } as import("@/lib/api/reviews").SubmitReviewBody);
    if (!res.success) {
      setServerError(res.message ?? "Could not submit your review. Please try again.");
      return;
    }
    if (res.data) onSuccess(res.data);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-gold/30 bg-gold/5 p-6 text-center"
      >
        <p className="font-serif text-xl text-obsidian mb-2">Thank you for your review</p>
        <p className="font-sans text-sm text-obsidian-400">
          Your review of <strong>{productName}</strong> has been submitted and will appear shortly.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <p className="font-sans text-xs tracking-widest uppercase text-obsidian-400 mb-2">Your rating</p>
        <StarRating value={rating} onChange={(v) => setValue("rating", v, { shouldValidate: true })} />
        {errors.rating && (
          <p className="font-sans text-xs text-error mt-1">Please select a star rating.</p>
        )}
      </div>

      <Input
        label="Review title"
        id="review-title"
        placeholder="e.g. Absolutely stunning piece"
        {...register("title")}
        error={errors.title?.message}
      />

      <div>
        <label htmlFor="review-body" className="block font-sans text-xs tracking-widest uppercase text-obsidian-500 mb-2">
          Your review
        </label>
        <textarea
          id="review-body"
          rows={4}
          placeholder="How was the fit, quality, and overall experience?"
          className={`w-full border bg-transparent px-4 py-3 font-sans text-sm text-obsidian
                      placeholder:text-obsidian-300 focus:outline-none focus:border-gold
                      transition-colors resize-none ${errors.body ? "border-error" : "border-obsidian-200"}`}
          {...register("body")}
        />
        {errors.body && (
          <p className="font-sans text-xs text-error mt-1">{errors.body.message}</p>
        )}
      </div>

      {serverError && (
        <p className="font-sans text-xs text-error bg-error/10 border border-error/20 px-4 py-3">
          {serverError}
        </p>
      )}

      <Button type="submit" loading={isSubmitting} variant="gold">
        Submit Review
      </Button>
    </form>
  );
}
