export interface QueryParams {
  page?: number;
  offset?: number;
  page_size?: number;
  order_by?: "created_at" | "updated_at";
  order?: "asc" | "desc";
}
