import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, LoginRequest } from "@/types";
import { authService } from "@/services/auth.service";

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true });

        try {
          const response = await authService.login(credentials);

          if (response.success && response.data) {
            const userData = response.data.user;
            set({
              user: {
                ...userData,
                roleId: (userData as unknown as { roleId?: number }).roleId ?? 0,
                roleName: (userData as unknown as { roleName?: string }).roleName ?? '',
              },
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.message || "Login failed. Please try again.",
            });
            return false;
          }
        } catch {
          set({
            isLoading: false,
            error: "An unexpected error occurred. Please try again.",
          });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });

        await authService.logout();

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      checkAuth: async () => {
        const token = authService.getToken();
        const storedUser = authService.getUser();

        if (!token) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          return;
        }

        // If we have a stored user, use it initially
        if (storedUser) {
          set({
            user: storedUser,
            token,
            isAuthenticated: true,
          });
        }

        // Verify token with server
        try {
          const response = await authService.getCurrentUser();
          if (response.success && response.data) {
            const userData = response.data;
            set({
              user: {
                ...userData,
                roleId: (userData as unknown as { roleId?: number }).roleId ?? 0,
                roleName: (userData as unknown as { roleName?: string }).roleName ?? '',
              },
              token,
              isAuthenticated: true,
            });
          } else {
            // Token invalid, clear auth
            authService.clearAuth();
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            });
          }
        } catch {
          // If server check fails, keep using stored data
          // This allows offline usage
        }
      },

      clearError: () => set({ error: null }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: "auth-store",
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          return {
            user: null,
            token: null,
            isAuthenticated: false,
          };
        }
        return persistedState as AuthStore;
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
