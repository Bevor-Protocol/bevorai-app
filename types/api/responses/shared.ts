export interface ResultsResponse<T> {
  results: T[];
}

export interface Pagination<T> {
  results: T[];
  page: number;
  page_size: number;
  more: boolean;
  total_pages: number;
}

export interface BooleanResponse {
  success: boolean;
}

export interface IdResponse {
  id: string;
}
