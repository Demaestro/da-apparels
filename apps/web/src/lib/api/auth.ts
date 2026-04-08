import { api, setAccessToken } from "./client";
import { supabase } from "@/lib/supabase/client";
import type { ApiResponse } from "@/lib/types";

/**
 * Try the NestJS API first. If unreachable (no backend deployed yet),
 * fall back to Supabase Auth directly so the UI remains fully functional.
 */

export async function login(email: string, password: string): Promise<ApiResponse<{ accessToken: string }>> {
  // Try primary API
  const res = await api.post<{ accessToken: string }>("/auth/login", { email, password }, { skipAuth: true });
  if (res.success) return res;

  // Fallback: Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { success: false, message: error.message };
  }
  const token = data.session?.access_token ?? null;
  if (token) setAccessToken(token);
  return { success: true, data: { accessToken: token ?? "" } };
}

export async function register(body: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<ApiResponse<{ accessToken: string }>> {
  // Try primary API
  const res = await api.post<{ accessToken: string }>("/auth/register", body, { skipAuth: true });
  if (res.success) return res;

  // Fallback: Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
    options: {
      data: { firstName: body.firstName, lastName: body.lastName },
    },
  });
  if (error) {
    return { success: false, message: error.message };
  }
  const token = data.session?.access_token ?? null;
  if (token) setAccessToken(token);
  return {
    success: true,
    data: { accessToken: token ?? "" },
    message: token
      ? undefined
      : "Account created — please check your email to confirm before signing in.",
  };
}

export async function logout() {
  await api.post("/auth/logout", {}).catch(() => null);
  await supabase.auth.signOut().catch(() => null);
  setAccessToken(null);
}

export async function getSupabaseSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
