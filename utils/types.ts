import { FindingLevel, FindingType, PlanStatusEnum } from "./enums";

export interface DropdownOption {
  name: string;
  value: string;
}

interface BaseSchema {
  id: string;
  created_at: string;
}

export interface PaginationI {
  more: boolean;
  page: number;
  page_size: number;
  total_pages: number;
}

/*  USER   */
export interface UserSchemaI extends BaseSchema {
  username: string;
}

export interface UserDetailedSchemaI extends UserSchemaI {
  email?: string;
  wallet?: string;
  is_google_oauth_connected: boolean;
  is_github_oauth_connected: boolean;
}

export interface HeadSchema {
  code_version_id?: string;
  analysis_version_id?: string;
}

export interface AnalysisNodeSchemaI extends BaseSchema {
  n_findings: number;
  n_scopes: number;
  user: UserSchemaI;
  team_id: string;
  team_slug: string;
  project_id: string;
  project_slug: string;
  code_version_id: string;
  is_owner: boolean;
  trigger: "manual_run" | "chat" | "manual_edit" | "fork" | "merge";
  is_leaf: boolean;
  is_public: boolean;
  parent_node_id?: string;
  root_node_id: string;
  merged_from_node_id?: string;
  children: string[];
}

export interface AnalysisVersionSchemaI extends BaseSchema {
  status: "waiting" | "processing" | "success" | "failed" | "partial";
  n_findings: number;
  n_scopes: number;
  code_version_id: string;
}

export interface AnalysisVersionPaginationI extends PaginationI {
  results: (AnalysisNodeSchemaI & { n: number })[];
}

export interface AnalysisDagEdgeSchemaI {
  source: string;
  target: string;
}

export interface AnalysisDagSchemaI {
  id: string;
  nodes: AnalysisNodeSchemaI[];
  edges: AnalysisDagEdgeSchemaI[];
}

export interface HeadFullSchemaI extends HeadSchema {
  analysis_version?: AnalysisNodeSchemaI;
  code_version?: CodeMappingSchemaI;
}

/*  CODE   */
export interface FunctionScopeI {
  id: string;
  generic_id: string;
  name: string;
  is_auditable: boolean;
  is_entry_point: boolean;
  is_override: boolean;
  is_within_scope: boolean;
  src_start_pos: number;
  src_end_pos: number;
  source_id: string;
}

export interface ContractScopeI {
  id: string;
  name: string;
  is_within_scope: boolean;
  src_start_pos: number;
  src_end_pos: number;
  source_id: string;
  n_auditable_fct: number;
  functions: FunctionScopeI[];
}

export interface TreeResponseI {
  id: string;
  path: string;
  source_hash: string;
  is_imported: boolean;
  is_known_target: boolean;
  is_within_scope: boolean;
  n_auditable_fct: number;
  contracts: ContractScopeI[];
}

export interface NodeSchemaI {
  id: string;
  source_id: string;
  contract_id?: string;
  generic_id?: string;
  node_type: string;
  src_start_pos: number;
  src_end_pos: number;
  name: string;
  signature?: string;
  path: string;
  is_auditable: boolean;
}

export interface NodeWithContentSchemaI extends NodeSchemaI {
  content: string;
  children: object;
}

export interface ScopeSchemaI extends NodeSchemaI {
  code_version_node_id: string;
  status: "waiting" | "processing" | "success" | "failed" | "partial";
}

export interface FindingSchemaI {
  id: string;
  code_version_node_id: string;
  type: FindingType;
  level: FindingLevel;
  name: string;
  explanation: string;
  recommendation: string;
  reference: string;
  validated_at?: Date;
  invalidated_at?: Date;
  feedback?: string;
}

export interface DraftFindingSchemaI extends FindingSchemaI {
  is_draft: boolean;
  draft_id?: string;
  draft_type?: "add" | "delete" | "update";
  base_finding_id?: string;
}

export interface AnalysisResultSchemaI {
  id: string;
  status: "waiting" | "processing" | "success" | "failed" | "partial";
  scopes: ScopeSchemaI[];
  findings: FindingSchemaI[];
}

export interface DraftSchemaI {
  id: string;
  scopes: ScopeSchemaI[];
  findings: DraftFindingSchemaI[];
  staged: DraftFindingSchemaI[];
}

export interface CodeRelationSchemaI {
  parent?: CodeMappingSchemaI;
  children: CodeMappingSchemaI[];
}

export interface ContractSourceResponseI extends BaseSchema {
  is_known_target: boolean;
  is_imported_dependency: boolean;
  path: string;
  content: string;
  solidity_version: string;
}

export interface FunctionChunkResponseI {
  source_id: string;
  version_id: string;
  contract_id: string;
  contract_name: string;
  function_name: string;
  chunk: string;
}

export interface CreditSyncResponseI {
  total_credits: number;
  credits_added: number;
  credits_removed: number;
}

export interface ChatMessageI extends BaseSchema {
  chat_id: string;
  chat_role: "user" | "system";
  message: string;
  tools: string[];
  code_version_id: string;
  analysis_node_id?: string;
}

export interface ChatPaginationI extends PaginationI {
  results: (ChatSchemaI & { n: number })[];
}

export interface ChatSchemaI {
  id: string;
  created_at: string;
  team_id: string;
  total_messages: string;
  project: ProjectSchemaI;
  user: UserSchemaI;
  analysis_node_id?: string;
  code_version_id: string;
  chat_type: "code" | "analysis";
}

export interface ChatFullSchemaI extends ChatSchemaI {
  code_version: CodeMappingSchemaI;
  analysis_node?: AnalysisNodeSchemaI;
}

export interface TeamSchemaI extends BaseSchema {
  slug: string;
  name: string;
  is_default: boolean;
  created_by_user_id: string;
}

export interface TeamDetailedSchemaI extends TeamSchemaI {
  created_by_user: UserSchemaI;
  n_projects: number;
  role: MemberRoleEnum;
  users: UserSchemaI[];
}

export interface ActivitySchemaI extends BaseSchema {
  id: string;
  created_at: string;
  team_id: string;
  team_slug: string;
  related_id: string;
  project_id?: string;
  project_slug?: string;
  user: UserSchemaI;
  method: string;
  entity_type: string;
}

export enum MemberRoleEnum {
  OWNER = "owner",
  MEMBER = "member",
}

export enum SourceTypeEnum {
  SCAN = "scan",
  PASTE = "paste",
  UPLOAD_FILE = "upload_file",
  UPLOAD_FOLDER = "upload_folder",
  REPOSITORY = "repository",
}

export interface CreateKeyBody {
  name: string;
  scopes: {
    project: "read" | "write";
    code: "read" | "write";
    analysis: "read" | "write";
    analysis_version: "read" | "write";
    chat: "read" | "write";
    user: "read";
  };
}

export interface CreateTeamBody {
  name: string;
}

export interface UpdateTeamBody {
  name: string;
}

export interface InviteMemberBody {
  members: {
    identifier: string; // Can be email or wallet address
    role: MemberRoleEnum;
  }[];
}

export interface UpdateMemberBody {
  role: MemberRoleEnum;
}

export interface CreateProjectBody {
  name: string;
  description?: string;
  tags?: string[];
}

export interface MemberSchemaI extends BaseSchema {
  role: MemberRoleEnum;
  user: UserSchemaI;
  team: TeamSchemaI;
  can_remove: boolean;
  can_update: boolean;
}

export interface MemberInviteSchema extends BaseSchema {
  user_id?: string;
  identifier: string;
  role: MemberRoleEnum;
  team: TeamSchemaI;
}

/* CODE PROJECT */
export interface ProjectSchemaI extends BaseSchema {
  name: string;
  slug: string;
  description?: string;
  tags: string[];
  is_default: boolean;
  team_id: string;
  created_by_user_id: string;
  github_repo_id?: number;
}

export interface InstallationSchemaI {
  id: number;
  created_at: string;
  updated_at: string;
  account_login: string;
  account_type: string;
  account_url: string;
  account_avatar_url: string;
  suspended_at?: string | null;
  deleted_at?: string | null;
}

export interface RepoSchemaI {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  full_name: string;
  is_private: boolean;
  is_active: boolean;
  installation: InstallationSchemaI;
  url: string; // computed field
}

export interface ProjectDetailedSchemaI extends ProjectSchemaI {
  n_codes: number;
  n_analyses: number;
  team: TeamSchemaI;
  created_by_user: UserSchemaI;
  github_repo?: RepoSchemaI | null;
}

export interface ProjectsPaginationI extends PaginationI {
  results: (ProjectDetailedSchemaI & { n: number })[];
}

/* CODE VERSION */
export interface CodeCreateSchemaI {
  id: string;
  status:
    | "waiting"
    | "parsing"
    | "parsed"
    | "failed_parsing"
    | "embedding"
    | "failed_embedding"
    | "success";
}

export interface CodeMappingSchemaI extends BaseSchema {
  name?: string;
  inferred_name: string;
  project_id: string;
  project_slug: string;
  user: UserSchemaI;
  parent_id?: string;
  version: CodeVersionSchemaI;
}

export interface CodeVersionSchemaI extends BaseSchema {
  network?: string;
  version_method: "tag" | "commit" | "hash" | "address";
  version_identifier: string;
  source_type: SourceTypeEnum;
  solc_version?: string;
  status:
    | "waiting"
    | "parsing"
    | "parsed"
    | "failed_parsing"
    | "embedding"
    | "failed_embedding"
    | "success";
  commit?: CommitSchemaI;
  repository_id?: number;
}

export interface CommitSchemaI {
  sha: string;
  author: string;
  message: string;
  ref: string;
  branch: string;
  timestamp: string;
}

export interface CodeVersionsPaginationI extends PaginationI {
  results: (CodeMappingSchemaI & { n: number })[];
}

export interface RecentCodeVersionSchemaI {
  is_any_code: boolean;
  code_version?: CodeMappingSchemaI;
}

export interface CodeSourceSchemaI extends BaseSchema {
  solc_version: string;
  path: string;
  is_imported: boolean;
  is_known_target: boolean;
  n_entry_points: number;
}

export interface CodeSourceWithContentSchemaI extends CodeSourceSchemaI {
  content: string;
}

/*    */

type Permission = "read" | "write" | "none";

export interface AuthPermissionSchema {
  team: Permission;
  project: Permission;
  contract: Permission;
  audit: Permission;
  user: Permission;
  chat: Permission;
}

export interface AuthSchema extends BaseSchema {
  team_id: string;
  name: string;
  prefix: string;
  permissions: AuthPermissionSchema;
  user: UserSchemaI;
}

export interface TokenIssueResponse {
  user_id: string;
  scoped_token: string;
  expires_at: number;
  refresh_token: string;
  refresh_expires_at: number;
}

interface StripeSeatTier {
  up_to: number | null;
  flat_amount: number;
  unit_amount: number;
}

interface StripeSeatPricing {
  type: "graduated";
  tiers: StripeSeatTier[];
}

interface StripeAnalysisUsage {
  included: number;
  unit_amount: number;
  billing_scheme: "metered";
}

interface StripeUsage {
  audits: StripeAnalysisUsage;
}

export interface StripePlanI {
  id: string;
  name: string;
  description: string;
  billing_interval: string;
  base_price: number;
  base_lookup_key: string;
  currency: string;
  included_seats: number;
  seat_pricing: StripeSeatPricing;
  usage: StripeUsage;
  features: string[];
  image: string | null;
  is_active: boolean;
}

export interface StripeAddonI {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_interval: string;
  features: string[];
  image: string | null;
  is_active: boolean;
  is_eligible: boolean;
  is_pending_removal: boolean;
  lookup_key: string;
}

export interface StripeSubscriptionLimit {
  feature: string;
  limit?: number;
  current: number;
  is_hard_cap: boolean;
}

export interface StripeSubscriptionI {
  plan_status: PlanStatusEnum;
  subscription: {
    id: string;
    status: string;
    cancel_at_period_end: boolean;
    metadata: {
      [key: string]: boolean;
    };
    plan_ids: string[];
  } | null;
  limits: StripeSubscriptionLimit[];
  n_seats: number;
  current_period_start: Date;
  current_period_end?: Date;
}

export interface StripeCustomerI {
  id?: string;
  exists: boolean;
  name?: string;
  email?: string;
}

export interface CreateStripeCustomerRequest {
  email: string;
  team_id: string;
}

export interface CreateStripeCustomerResponse {
  stripe_customer_id: string;
  email: string;
}

export interface CreateCheckoutSessionRequest {
  price_id: string;
  team_id: string;
  success_url: string;
  cancel_url: string;
}

export interface CreateCheckoutSessionResponse {
  checkout_url: string;
}

export interface StripePaymentMethodI {
  id: string;
  object: "payment_method";
  billing_details: {
    address: {
      city: string | null;
      country: string | null;
      line1: string | null;
      line2: string | null;
      postal_code: string | null;
      state: string | null;
    };
    email: string | null;
    name: string | null;
    phone: string | null;
  };
  card: {
    brand: string;
    checks: {
      address_line1_check: string | null;
      address_postal_code_check: string | null;
      cvc_check: string | null;
    };
    country: string | null;
    exp_month: number;
    exp_year: number;
    fingerprint: string | null;
    funding: string;
    generated_from: string | null;
    last4: string;
    networks: {
      available: string[];
      preferred: string | null;
    };
    three_d_secure_usage: {
      supported: boolean;
    };
    wallet: string | null;
  };
  created: number;
  customer: string | null;
  livemode: boolean;
  metadata: Record<string, any>;
  type: string;
}

export interface UpdateSubscriptionRequest {
  subscription_id: string;
  price_id: string;
}

export interface GithubBaseSchemaI {
  is_authenticated: boolean;
}

interface GitHubInstallationAccount {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  html_url: string;
  type: "User" | "Organization";
}

interface GitHubInstallationPermissions {
  metadata: string;
  checks?: string | null;
  contents?: string | null;
}

interface GitHubInstallationResponse {
  id: number;
  account: GitHubInstallationAccount;
  access_tokens_url: string;
  repositories_url: string;
  html_url: string;
  app_id: number;
  target_id: number;
  target_type: "User" | "Organization";
  permissions: GitHubInstallationPermissions;
  events: string[];
  repository_selection: "all" | "selected";
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  suspended_at?: string | null; // ISO datetime string
}

interface GitHubRepositoryOwner {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  html_url: string;
  type: "User" | "Organization";
}

interface GitHubRepositoryPermissions {
  admin: boolean;
  push: boolean;
  pull: boolean;
}

interface GitHubRepositoryLicense {
  key: string;
  name: string;
  url?: string | null;
  spdx_id?: string | null;
  node_id?: string | null;
  html_url?: string | null;
}

interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  owner: GitHubRepositoryOwner;
  private: boolean;
  html_url: string;
  description?: string | null;
  fork: boolean;
  url: string;
  default_branch: string;
  visibility?: "public" | "private" | "internal" | null;
  created_at?: string | null; // ISO datetime string
  updated_at?: string | null; // ISO datetime string
  pushed_at?: string | null; // ISO datetime string
  permissions?: GitHubRepositoryPermissions | null;
  license?: GitHubRepositoryLicense | null;
  language?: string | null;
  forks_count?: number | null;
  stargazers_count?: number | null;
  watchers_count?: number | null;
  open_issues_count?: number | null;
  topics: string[];
  archived?: boolean | null;
  disabled?: boolean | null;
}

interface GithubRepositoriesResponse {
  total_count: number;
  repositories: GitHubRepository[];
}

interface GithubInstallationsResponse {
  total_count: number;
  installations: GitHubInstallationResponse[];
}

export interface GithubInstallationsSchemaI extends GithubBaseSchemaI {
  installation_info?: GithubInstallationsResponse;
}

export interface GithubRepositoriesSchemaI extends GithubBaseSchemaI {
  repository_info?: GithubRepositoriesResponse;
}

export type ItemType =
  | "team"
  | "project"
  | "code"
  | "chat"
  | "analysis"
  | "analysis_node"
  | "member"
  | "settings";

export type HrefProps = {
  teamSlug?: string;
  projectSlug?: string;
  codeId?: string;
  chatId?: string;
  nodeId?: string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type AsyncComponent<P = {}> = AsyncFunctionComponent<P>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AsyncFunctionComponent<P = {}> {
  (props: P): Promise<React.ReactNode>;
}
