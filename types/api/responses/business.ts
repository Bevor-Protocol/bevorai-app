import { GithubRepositorySchema } from "@/types/api/responses/github";

export enum MemberRoleEnum {
  OWNER = "owner",
  MEMBER = "member",
}

export type UsageResource =
  | "contract_light"
  | "contract_heavy"
  | "contract_private_repo"
  | "audit"
  | "chat";

export type ActivityMethod = "create" | "delete" | "update";
export type ActivityEntityType =
  | "code_version"
  | "project"
  | "team"
  | "analysis"
  | "chat"
  | "member";

export interface UserSchema {
  id: string;
  created_at: string;
  username: string;
}

export interface ProjectSchema {
  id: string;
  created_at: string;
  name: string;
  slug: string;
  description?: string;
  tags: string[];
  team_id: string;
  created_by_user_id: string;
  is_default: boolean;
  github_repo_id: number | null;
}

export interface TeamSchema {
  id: string;
  created_at: string;
  name: string;
  slug: string;
  is_default: boolean;
  created_by_user_id: string;
}

export interface TeamDetailedSchema extends TeamSchema {
  created_by_user: UserSchema;
  n_projects: number;
  role: MemberRoleEnum;
  users: UserSchema[];
}

export interface ProjectDetailedSchema extends ProjectSchema {
  n_codes: number;
  n_analyses: number;
  team: TeamSchema;
  created_by_user: UserSchema;
  github_repo: GithubRepositorySchema | null;
}

export interface ProjectIndex extends ProjectDetailedSchema {
  n: number;
}

export interface ActivitySchema {
  id: string;
  created_at: string;
  related_id: string;
  team_id: string;
  project_id?: string;
  team_slug: string;
  project_slug?: string;
  user: UserSchema;
  method: ActivityMethod;
  entity_type: ActivityEntityType;
}

export interface AuthSchema {
  id: string;
  created_at: string;
  team_id: string;
  name: string;
  prefix: string;
  scopes: string[];
  user: UserSchema;
}

export interface MemberSchema {
  id: string;
  created_at: string;
  role: MemberRoleEnum;
  user: UserSchema;
  team: TeamSchema;
}

export interface MemberSchemaWithPermissions extends MemberSchema {
  can_remove: boolean;
  can_update: boolean;
}

export interface InviteSchema {
  id: string;
  created_at: string;
  user_id?: string;
  identifier: string;
  role: MemberRoleEnum;
  team: TeamSchema;
}

export interface UserDetailedSchema extends UserSchema {
  email?: string;
  wallet?: string;
  is_google_oauth_connected: boolean;
  is_github_oauth_connected: boolean;
}

export interface ApiKeyResponse {
  api_key: string;
}

export interface ProductListResponse {
  results: unknown[];
}

export interface TokenIssueResponse {
  user_id: string;
  scoped_token: string;
  expires_at: number;
  refresh_token: string;
  refresh_expires_at: number;
}

export interface TokenValidateResponse {
  user_id: string;
}

export interface AttachTokenResponse {
  token: string;
}

export interface MagicLinkResponse {
  is_user_created: boolean;
}

export interface UserTokenAuthenticateBody {
  token: string;
  method: "magic_links" | "oauth";
  session_duration_minutes?: number;
}

export interface SseClaimsBody {
  team_slug?: string;
  project_slug?: string;
  code_version_id?: string;
  analysis_node_id?: string;
  chat_id?: string;
}

export interface SseTokenResponse {
  token: string;
}

export interface ValidatedFindingSchema {
  id: string;
  created_at: string;
  finding_id: string;
  analysis_node_id: string;
  is_remediated: boolean;
  type: string;
  level: string;
  name: string;
  explanation: string;
  recommendation?: string;
  reference?: string;
  validated_at?: string;
  invalidated_at?: string;
  feedback?: string;
}
