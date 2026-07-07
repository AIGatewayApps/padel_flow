/**
 * Shared action result type used across all server actions.
 * Prefer this over per-file ActionResult definitions.
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
