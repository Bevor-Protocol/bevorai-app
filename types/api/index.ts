export type ApiSuccess<T> = { ok: true; data: T; requestId: string };
export type ApiError = { ok: false; error: any; requestId: string };
export type ApiResponse<T> = Promise<ApiSuccess<T> | ApiError>;

export const isApiError = (err: any): err is ApiError => {
  return err && err.ok === false;
};
