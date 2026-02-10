import { api, post } from "@/lib/axios";
import { LoginRequest, LoginResponse, User, ApiResponse } from "@/types";

const AUTH_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "auth_user";

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await post<LoginResponse, LoginRequest>(
        "/auth/login",
        credentials
      );

      if (response.success && response.data) {
        // Store tokens
        this.setToken(response.data.token);
        if (response.data.refreshToken) {
          this.setRefreshToken(response.data.refreshToken);
        }
        // Store user data
        this.setUser(response.data.user);
      }

      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: LoginResponse } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    }
  },

  async logout(): Promise<void> {
    try {
      await post("/auth/logout");
    } catch {
      // Ignore logout API errors
    } finally {
      this.clearAuth();
    }
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await api.get<ApiResponse<User>>("/auth/me");
      if (response.data.success && response.data.data) {
        this.setUser(response.data.data);
      }
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<User> } };
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: "Failed to get user data",
      };
    }
  },

  async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await post<LoginResponse>("/auth/refresh", {
        refreshToken,
      });

      if (response.success && response.data) {
        this.setToken(response.data.token);
        if (response.data.refreshToken) {
          this.setRefreshToken(response.data.refreshToken);
        }
        return true;
      }
      return false;
    } catch {
      this.clearAuth();
      return false;
    }
  },

  // Token management
  setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  },

  getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return null;
  },

  setRefreshToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
  },

  getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  },

  // User management
  setUser(user: User): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  getUser(): User | null {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem(USER_KEY);
      if (userData) {
        try {
          return JSON.parse(userData) as User;
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  // Clear all auth data
  clearAuth(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

export default authService;
