import { QueryParams } from "@/types/api/requests/shared";

export interface ProjectsQueryParams extends QueryParams {
  name?: string;
  tag?: string;
}
