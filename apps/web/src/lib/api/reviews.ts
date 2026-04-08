import { api } from "./client";
import { supabase } from "@/lib/supabase/client";
import type { ApiResponse } from "@/lib/types";

export interface ProductReview {
  id: string;
  productId: string;
  orderId?: string | null;
  rating: number; // 1-5
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
  verified: boolean; // true when linked to a real order
}

export interface SubmitReviewBody {
  productId: string;
  orderId?: string;
  rating: number;
  title: string;
  body: string;
}

// Fetch reviews for a product (tries API, falls back to Supabase table)
export async function fetchProductReviews(productId: string): Promise<ApiResponse<ProductReview[]>> {
  const res = await api.get<ProductReview[]>(`/reviews?productId=${productId}`, { skipAuth: true });
  if (res.success) return res;

  // Supabase fallback
  const { data, error } = await supabase
    .from("product_reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) return { success: false, message: error.message };

  const reviews: ProductReview[] = (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    productId: String(row.product_id),
    orderId: row.order_id ? String(row.order_id) : null,
    rating: Number(row.rating),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    authorName: String(row.author_name ?? "Verified Customer"),
    createdAt: String(row.created_at),
    verified: Boolean(row.order_id),
  }));

  return { success: true, data: reviews };
}

// Submit a new review (tries API, falls back to Supabase)
export async function submitReview(body: SubmitReviewBody): Promise<ApiResponse<ProductReview>> {
  const res = await api.post<ProductReview>("/reviews", body);
  if (res.success) return res;

  const { data: userData } = await supabase.auth.getUser();
  const authorName =
    userData.user?.user_metadata?.firstName
      ? `${userData.user.user_metadata.firstName} ${(userData.user.user_metadata.lastName ?? "")[0] ?? ""}.`.trim()
      : "Verified Customer";

  const { data, error } = await supabase
    .from("product_reviews")
    .insert({
      product_id: body.productId,
      order_id: body.orderId ?? null,
      rating: body.rating,
      title: body.title,
      body: body.body,
      author_name: authorName,
      user_id: userData.user?.id ?? null,
    })
    .select()
    .single();

  if (error) return { success: false, message: error.message };

  return {
    success: true,
    data: {
      id: String(data.id),
      productId: String(data.product_id),
      orderId: data.order_id ? String(data.order_id) : null,
      rating: data.rating,
      title: data.title,
      body: data.body,
      authorName: data.author_name,
      createdAt: data.created_at,
      verified: Boolean(data.order_id),
    },
  };
}
