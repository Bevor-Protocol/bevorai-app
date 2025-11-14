import { FetchQueryOptions } from "@tanstack/react-query";
import { AnalysisUpdateMethodEnum, FindingLevel, PlanStatusEnum } from "./enums";

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
  total_pages: number;
}

/*  USER   */
export interface UserSchemaI extends BaseSchema {
  username: string;
}

export interface UserDetailedSchemaI extends UserSchemaI {
  email?: string;
  wallet?: string;
}

export interface AnalysisStatusSchemaI {
  id: string;
  status: string;
  scopes: {
    id: string;
    status: "waiting" | "processing" | "success" | "failed" | "partial";
  }[];
}

export interface AnalysisHeadSchema {
  code_version_id?: string;
  analysis_version_id?: string;
}

export interface AnalysisSchemaI extends BaseSchema {
  is_owner: boolean;
  is_public: boolean;
  name?: string;
  description?: string;
  n_versions: number;
  user: UserSchemaI;
  code_project_id: string;
  update_method: AnalysisUpdateMethodEnum;
  head: AnalysisHeadSchema;
}

export interface AnalysisVersionMappingSchemaI extends BaseSchema {
  name: string;
  user: UserSchemaI;
  analysis_id: string;
  is_active: boolean;
  is_owner: boolean;
  trigger: "manual_run" | "chat" | "manual_edit" | "fork" | "merge";
  parent?: BaseSchema & { name: string };
  children: (BaseSchema & { name: string })[];
  version: AnalysisVersionSchemaI;
}

export interface AnalysisVersionSchemaI extends BaseSchema {
  status: "waiting" | "processing" | "success" | "failed" | "partial";
  n_findings: number;
  n_scopes: number;
  code_version_id: string;
}

export interface AnalysisPaginationI extends PaginationI {
  results: (AnalysisSchemaI & { n: number })[];
}

export interface AnalysisVersionPaginationI extends PaginationI {
  results: (AnalysisVersionMappingSchemaI & { n: number })[];
}

export interface AnalysisHeadFullSchemaI extends AnalysisHeadSchema {
  analysis_version?: AnalysisVersionMappingSchemaI;
  code_version?: CodeVersionMappingSchemaI;
}
/*  CODE   */
export interface FunctionScopeI {
  id: string;
  merkle_hash: string;
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
  merkle_hash: string;
  name: string;
  is_within_scope: boolean;
  src_start_pos: number;
  src_end_pos: number;
  source_id: string;
  functions: FunctionScopeI[];
}

export interface TreeResponseI {
  id: string;
  path: string;
  is_imported: boolean;
  is_within_scope: boolean;
  contracts: ContractScopeI[];
}

export interface FindingSchemaI {
  id: string;
  callable: {
    merkle_hash: string;
    name: string;
    signature: string;
  };
  findings: {
    id: string;
    type: string;
    level: FindingLevel;
    name: string;
    explanation: string;
    recommendation: string;
    reference: string;
    metadata?: {
      attested_at?: string;
      is_verified: boolean;
      feedback?: string;
    };
  }[];
}

export interface NodeSearchResponseI {
  instance_source_id: string;
  node_type: string;
  merkle_hash: string;
  src_start_pos: number;
  src_end_pos: number;
  name: string;
  signature?: string;
  path: string;
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

export interface ChatMessageI {
  id: string;
  role: "user" | "system";
  timestamp: string;
  content: string;
}

export interface ChatPaginationI extends PaginationI {
  results: (ChatSchemaI & { n: number })[];
}

export interface ChatSchemaI {
  id: string;
  created_at: string;
  team_id: string;
  is_visibile: string;
  total_messages: string;
  code_project_id: string;
  user: UserSchemaI;
}

export interface ChatMessagesResponseI extends ChatSchemaI {
  messages: ChatMessageI[];
}

export interface TeamSchemaI extends BaseSchema {
  name: string;
  is_default: boolean;
  created_by_user_id: string;
}

export interface TeamDetailedSchemaI extends TeamSchemaI {
  created_by_user: UserSchemaI;
}

export interface TeamOverviewSchemaI extends TeamDetailedSchemaI {
  n_projects: number;
  role: MemberRoleEnum;
  users: UserSchemaI[];
}

export interface ActivitySchemaI extends BaseSchema {
  id: string;
  created_at: string;
  team_id: string;
  related_id: string;
  project_id?: string;
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
export interface CodeProjectSchemaI extends BaseSchema {
  name: string;
  description?: string;
  tags: string[];
  is_default: boolean;
  team_id: string;
  created_by_user_id: string;
}

export interface CodeProjectDetailedSchemaI extends CodeProjectSchemaI {
  n_codes: number;
  n_analyses: number;
  team: TeamSchemaI;
  created_by_user: UserSchemaI;
}

export interface CodeProjectsPaginationI extends PaginationI {
  results: (CodeProjectDetailedSchemaI & { n: number })[];
}

/* CODE VERSION */
export interface CodeVersionMappingSchemaI extends BaseSchema {
  name?: string;
  inferred_name: string;
  code_project_id: string;
  parent_version_id?: string;
  user: UserSchemaI;
  child?: BaseSchema & { name: string };
  parent?: BaseSchema & { name: string };
  version: CodeVersionSchemaI;
}

export interface CodeVersionSchemaI extends BaseSchema {
  network?: string;
  version_method: "tag" | "commit" | "hash" | "address";
  version_identifier: string;
  source_type: SourceTypeEnum;
  source_url?: string;
  solc_version?: string;
}

export interface CodeVersionsPaginationI extends PaginationI {
  results: (CodeVersionMappingSchemaI & { n: number })[];
}

export interface CodeSourceSchemaI extends BaseSchema {
  path: string;
  is_imported_dependency: boolean;
  n_auditable_fcts: number;
  source_hash_id: string;
}

export interface CodeSourceContentSchemaI extends BaseSchema {
  content: string;
  solc_version: string;
  content_hash: string;
  path: string;
  is_imported_dependency: boolean;
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

export type ItemType =
  | "team"
  | "project"
  | "code"
  | "chat"
  | "analysis"
  | "analysis_version"
  | "member"
  | "settings";

export interface BreadcrumbItem {
  route: string;
  display_name: string;
  type: ItemType;
}

export interface BreadcrumbPage {
  display_name: string;
  type: ItemType;
}

export interface BreadcrumbFavorite {
  display_name: string;
  type: ItemType;
  id: string;
  route: string;
}

export interface BreadcrumbNav {
  display_name: string;
  route: string;
}

export interface BreadcrumbSchemaI {
  team_id: string;
  navs: BreadcrumbNav[];
  items: BreadcrumbItem[];
  page: BreadcrumbPage;
  allow_favorite: boolean;
  favorite?: BreadcrumbFavorite;
}

export type HrefProps = {
  teamId?: string;
  projectId?: string;
  versionId?: string;
  analysisId?: string;
  chatId?: string;
  analysisVersionId?: string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type AsyncComponent<P = {}> = AsyncFunctionComponent<P>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AsyncFunctionComponent<P = {}> {
  (props: P): Promise<React.ReactNode>;
}

export type BreadcrumbQueryOptions = FetchQueryOptions<
  BreadcrumbSchemaI,
  Error,
  BreadcrumbSchemaI,
  (
    | string
    | {
        [key: string]: string | undefined;
      }
  )[],
  never
>;
