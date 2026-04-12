import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage if available
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access - but not for auth endpoints
      const isAuthEndpoint = error.config?.url?.startsWith("/auth/");
      if (typeof window !== "undefined" && !isAuthEndpoint) {
        // Clear all auth data
        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("auth_user");

        // Clear Zustand persisted store
        localStorage.removeItem("auth-store");

        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Generic request functions
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await api.get<T>(url, config);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    // Don't log 401 errors - they're handled by the response interceptor
    if (axiosError.response?.status !== 401) {
      console.error(`GET ${url} failed:`, axiosError.response?.status, axiosError.response?.data);
    }
    throw error;
  }
}

export async function post<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await api.post<T>(url, data, config);
  return response.data;
}

export async function put<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await api.put<T>(url, data, config);
  return response.data;
}

export async function patch<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await api.patch<T>(url, data, config);
  return response.data;
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await api.delete<T>(url, config);
  return response.data;
}

export default api;
