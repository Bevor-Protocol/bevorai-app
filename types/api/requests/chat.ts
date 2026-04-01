import { QueryParams } from "@/types/api/requests/shared";

export interface GraphChatsQueryParams extends QueryParams {
  project_id?: string;
  project_slug?: string;
  code_version_id?: string;
  analysis_id?: string;
}

export interface SecurityChatsQueryParams extends QueryParams {
  project_id?: string;
  project_slug?: string;
  code_version_id?: string;
  analysis_id?: string;
}
