import { toast } from "sonner";

/**
 * Standard toast message utility for consistent notifications across the app.
 *
 * Usage:
 *   import { showToast } from "@/lib/utils/toast-messages";
 *
 *   // CRUD operations
 *   showToast.created("Organization");
 *   showToast.updated("Job Title");
 *   showToast.deleted("Employee");
 *
 *   // Error handling
 *   showToast.error("Failed to fetch data");
 *   showToast.createError("Organization", error);
 *   showToast.updateError("Job Title", error);
 *   showToast.deleteError("Employee", error);
 *   showToast.fetchError("organizations", error);
 */

// --- Error message extraction ---

function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;

  if (error instanceof Error) return error.message;

  if (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "Something went wrong";
}

// --- Standard toast functions ---

export const showToast = {
  // ---- Success ----

  /** Generic success toast */
  success(message: string) {
    toast.success(message);
  },

  /** Entity created successfully */
  created(entityName: string) {
    toast.success(`${entityName} created successfully`);
  },

  /** Entity updated successfully */
  updated(entityName: string) {
    toast.success(`${entityName} updated successfully`);
  },

  /** Entity deleted successfully */
  deleted(entityName: string) {
    toast.success(`${entityName} deleted successfully`);
  },

  // ---- Error ----

  /** Generic error toast */
  error(message: string) {
    toast.error(message);
  },

  /** Fetch/load error with fallback message */
  fetchError(entityName: string, error?: unknown) {
    const msg = error
      ? getErrorMessage(error)
      : `Failed to fetch ${entityName}`;
    toast.error(msg);
  },

  /** Create error with fallback message */
  createError(entityName: string, error?: unknown) {
    const msg = error
      ? getErrorMessage(error)
      : `Failed to create ${entityName}`;
    toast.error(msg);
  },

  /** Update error with fallback message */
  updateError(entityName: string, error?: unknown) {
    const msg = error
      ? getErrorMessage(error)
      : `Failed to update ${entityName}`;
    toast.error(msg);
  },

  /** Delete error with fallback message */
  deleteError(entityName: string, error?: unknown) {
    const msg = error
      ? getErrorMessage(error)
      : `Failed to delete ${entityName}`;
    toast.error(msg);
  },

  // ---- Info / Warning ----

  /** Informational toast */
  info(message: string) {
    toast.info(message);
  },

  /** Warning toast */
  warning(message: string) {
    toast.warning(message);
  },

  // ---- Loading (promise-based) ----

  /**
   * Show loading → success/error toast for async operations.
   *
   * Usage:
   *   showToast.promise(
   *     obsService.create(data),
   *     { loading: "Creating...", success: "Organization created", error: "Failed to create" }
   *   );
   */
  promise<T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ) {
    return toast.promise(promise, messages);
  },
} as const;
