import { put } from "@/lib/axios";
import { ApiResponse } from "@/types";

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const profileService = {
  async changePassword(
    userId: string,
    data: ChangePasswordRequest
  ): Promise<ApiResponse<unknown>> {
    try {
      const response = await put<ApiResponse<unknown>, ChangePasswordRequest>(
        `/v1/users/${userId}/password`,
        data
      );
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: ApiResponse<unknown> } };
      if (err.response?.data) return err.response.data;
      return { success: false, message: "Failed to update password" };
    }
  },
};

export default profileService;
