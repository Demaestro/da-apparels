"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { fetchProductReviews, type ProductReview } from "@/lib/api/reviews";
import { ReviewForm } from "./review-form";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= rating ? "text-gold" : "text-obsidian-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: ProductReview }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-obsidian-100 p-5 space-y-3"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Stars rating={review.rating} />
            {review.verified && (
              <span className="font-sans text-[10px] tracking-widest uppercase text-gold bg-gold/10 px-2 py-0.5">
                Verified Purchase
              </span>
            )}
          </div>
          <p className="font-serif text-base text-obsidian">{review.title}</p>
        </div>
        <time className="font-sans text-xs text-obsidian-400 shrink-0">
          {new Date(review.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
        </time>
      </div>
      <p className="font-sans text-sm text-obsidian-500 leading-loose">{review.body}</p>
      <p className="font-sans text-xs text-obsidian-400">— {review.authorName}</p>
    </motion.article>
  );
}

function RatingSummary({ reviews }: { reviews: ProductReview[] }) {
  if (reviews.length === 0) return null;

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="flex flex-col sm:flex-row gap-6 border border-obsidian-100 p-6 mb-8">
      <div className="text-center shrink-0">
        <p className="font-display text-5xl text-obsidian">{avg.toFixed(1)}</p>
        <Stars rating={Math.round(avg)} />
        <p className="font-sans text-xs text-obsidian-400 mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="flex-1 space-y-2">
        {counts.map(({ star, count }) => (
          <div key={star} className="flex items-center gap-3 text-xs font-sans">
            <span className="text-obsidian-400 w-3">{star}</span>
            <div className="flex-1 h-1.5 bg-obsidian-100">
              <div
                className="h-full bg-gold transition-all duration-500"
                style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : "0%" }}
              />
            </div>
            <span className="text-obsidian-400 w-4 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
  orderId?: string; // pass when rendering from order detail page
  allowReview?: boolean;
}

export function ProductReviews({ productId, productName, orderId, allowReview = false }: ProductReviewsProps) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => fetchProductReviews(productId),
  });

  const reviews = data?.data ?? [];

  function handleNewReview(review: ProductReview) {
    queryClient.setQueryData(["reviews", productId], (old: typeof data) => ({
      ...old,
      data: [review, ...(old?.data ?? [])],
    }));
    setShowForm(false);
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-obsidian">
          Customer Reviews
          {reviews.length > 0 && (
            <span className="ml-2 font-sans text-sm text-obsidian-400">({reviews.length})</span>
          )}
        </h2>
        {allowReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="font-sans text-xs tracking-widest uppercase text-gold hover:text-obsidian transition-colors border border-gold/40 hover:border-obsidian px-4 py-2"
          >
            Write a Review
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            key="review-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border border-obsidian-100 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <p className="font-serif text-lg text-obsidian">Share your experience</p>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-obsidian-400 hover:text-obsidian transition-colors"
                  aria-label="Close form"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ReviewForm
                productId={productId}
                productName={productName}
                orderId={orderId}
                onSuccess={handleNewReview}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="border border-obsidian-100 p-5 space-y-3">
              <div className="h-4 w-24 skeleton" />
              <div className="h-4 w-48 skeleton" />
              <div className="h-12 skeleton" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="border border-obsidian-100 p-8 text-center">
          <p className="font-serif text-lg text-obsidian mb-2">No reviews yet</p>
          <p className="font-sans text-sm text-obsidian-400">
            {allowReview ? "Be the first to share your experience with this piece." : "Reviews will appear here once customers share their experience."}
          </p>
        </div>
      ) : (
        <>
          <RatingSummary reviews={reviews} />
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
