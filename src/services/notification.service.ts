import { api } from '@/lib/axios';

import type { Notification } from '@/types/notification';

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const notificationService = {
  async getNotifications(params: { page?: number; limit?: number; type?: string }): Promise<PaginatedResponse<Notification>> {
    const { data } = await api.get('/v1/notifications', { params });
    return data;
  },

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    const { data } = await api.get('/v1/notifications/unread-count');
    return data;
  },

  async markAsRead(id: number): Promise<void> {
    await api.put(`/v1/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.put('/v1/notifications/read-all');
  },
};

export default notificationService;
