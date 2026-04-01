import { QueryParams } from "@/types/api/requests/shared";
import { CodeVersionStatus, Network } from "@/types/api/responses/graph";

export interface CodesQueryParams extends QueryParams {
  project_id?: string;
  project_slug?: string;
  user_id?: string;
  network?: Network;
  status?: CodeVersionStatus;
  identifier?: string;
}
