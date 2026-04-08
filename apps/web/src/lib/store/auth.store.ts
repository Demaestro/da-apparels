import { create } from "zustand";
import { logout as apiLogout } from "../api/auth";

interface AuthUser {
  id: string;
  email: string;
  role: string;
  profile?: { firstName: string; lastName: string };
}

interface AuthStore {
  user: AuthUser | null;
  isHydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

/**
 * Set (or clear) a non-httpOnly `da_role` cookie so that Next.js Edge Middleware
 * can check the user's role without parsing a JWT.
 * This cookie is NOT trusted for data access — the API enforces roles via JWT.
 * Max-age matches the access token lifetime (15 min).
 */
function syncRoleCookie(role: string | null) {
  if (typeof document === "undefined") return;
  if (role) {
    document.cookie = `da_role=${role}; path=/; max-age=900; samesite=lax`;
  } else {
    document.cookie = "da_role=; path=/; max-age=0; samesite=lax";
  }
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isHydrated: false,

  setUser: (user) => {
    syncRoleCookie(user?.role ?? null);
    set({ user, isHydrated: true });
  },

  logout: async () => {
    await apiLogout();
    syncRoleCookie(null);
    set({ user: null });
  },
}));
