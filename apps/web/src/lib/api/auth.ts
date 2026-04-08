import { api, setAccessToken } from "./client";

export async function login(email: string, password: string) {
  const res = await api.post<{ accessToken: string }>("/auth/login", { email, password }, { skipAuth: true });
  if (res.success && res.data) setAccessToken(res.data.accessToken);
  return res;
}

export async function register(body: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const res = await api.post<{ accessToken: string }>("/auth/register", body, { skipAuth: true });
  if (res.success && res.data) setAccessToken(res.data.accessToken);
  return res;
}

export async function logout() {
  await api.post("/auth/logout", {});
  setAccessToken(null);
}
