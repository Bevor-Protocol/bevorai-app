import { AxiosError, type AxiosResponse } from "axios";

import type { ApiError, ApiResponse } from "@/types/api";

const toApiError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    const requestId = (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
    return {
      ok: false as const,
      error: error.response?.data ?? { message: error.message },
      requestId,
    };
  }
  return {
    ok: false as const,
    error: { message: error instanceof Error ? error.message : String(error) },
    requestId: "",
  };
};

/** Map axios response body (or a derived value) plus `bevor-request-id` for use with {@link apiRequest}. */
export const withRequestId = <T>(
  response: AxiosResponse<unknown>,
  data: T,
): { data: T; requestId: string } => ({
  data,
  requestId: String(response.headers["bevor-request-id"] ?? ""),
});

/**
 * Wraps a server action body: the inner function returns a promise resolving to
 * {@link withRequestId}(response, payload). Rejections become `ApiError`.
 */
export function apiRequest<TArgs extends unknown[], T>(
  fn: (...args: TArgs) => Promise<{ data: T; requestId: string }>,
): (...args: TArgs) => ApiResponse<T> {
  return (...args: TArgs) =>
    fn(...args)
      .then(({ data, requestId }) => ({ ok: true as const, data, requestId }))
      .catch(toApiError);
}
