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

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isHydrated: false,

  setUser: (user) => set({ user, isHydrated: true }),

  logout: async () => {
    await apiLogout();
    set({ user: null });
  },
}));
