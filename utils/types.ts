import { AuditStatus, FindingLevel, Message } from "./enums";

export type MessageType = {
  type: Message;
  content: string;
};

export type ModalContextI = {
  setOpen: React.Dispatch<React.SetStateAction<"modal" | "none">>;
  setContent: React.Dispatch<React.SetStateAction<React.ReactNode>>;
};

export type ModalStateI = {
  show: (content: React.ReactNode) => void;
  hide: () => void;
};

export interface ChatContextType {
  isOpen: boolean;
  messages: ChatMessageI[];
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  currentAuditId: string | null;
  setCurrentAuditId: React.Dispatch<React.SetStateAction<string | null>>;
}

export interface DropdownOption {
  name: string;
  value: string;
}

export interface StatsResponseI {
  n_audits: number;
  n_contracts: number;
  n_users: number;
  n_apps: number;
  findings: { [key: string]: { [key: string]: string[] } };
}

export interface TimeseriesResponseI {
  count: number;
  timeseries: { date: Date; count: number }[];
}

interface StringIntDict {
  [key: string]: number;
}

export interface MultiTimeseriesResponseI {
  counts: StringIntDict;
  timeseries: {
    date: Date;
    counts: StringIntDict;
  }[];
  levels: string[];
}

export interface FindingSummaryI {
  n_critical: number;
  n_high: number;
  n_medium: number;
  n_low: number;
}

export interface AuditObservationI {
  n: number;
  id: string;
  created_at: string;
  status: string;
  logic_version: string;
  processing_time_seconds: number;
  code_version_mapping_id: string;
  version: CodeVersionSchema;
  findings: FindingSummaryI;
}

export interface AuditTableReponseI {
  more: boolean;
  total_pages: number;
  results: AuditObservationI[];
}

export interface FindingI {
  id: string;
  type: string;
  level: FindingLevel;
  name: string;
  explanation: string;
  recommendation: string;
  reference: string;
  feedback?: string;
  attested_at?: Date;
  is_attested: boolean;
  is_verified: boolean;
  function_id: string;
}

interface BaseSchema {
  id: string;
  created_at: string;
}

export interface UserSchemaI extends BaseSchema {
  total_credits: number;
  used_credits: number;
  available_credits: number;
}

export interface AuditSchemaI extends BaseSchema {
  status: AuditStatus;
  logic_version: string;
  model_version: string;
  n_findings: number;
  is_public: boolean;
  code_version_mapping_id: string;
  code_version: CodeVersionSchema;
}

export interface AuditFindingsResponseI extends AuditSchemaI {
  findings: FindingI[];
}

export interface UserInfoResponseI extends BaseSchema {
  total_credits: number;
  used_credits: number;
  available_credits: number;
  teams: TeamSchemaI[];
}

export interface UserTimeseriesResponseI {
  n_audits: number;
  n_contracts: number;
  audit_history: { date: string; count: number }[];
  contract_history: { date: string; count: number }[];
}

export interface ContractResponseI {
  project_id: string;
  version_id: string;
}

export interface ContractVersionSourceTrimI extends BaseSchema {
  path: string;
  is_imported_dependency: boolean;
}

export interface ContractVersionSourceI extends BaseSchema {
  content: string;
  solc_version: string;
}

export interface FunctionScopeI extends BaseSchema {
  name: string;
  is_inherited: boolean;
  is_auditable: boolean;
  is_entry_point: boolean;
  is_override: boolean;
  contract_name_defined: string;
  is_within_scope: boolean;
  src_start_pos: number;
  src_end_pos: number;
  source_defined_in_id: string;
  source_consumed_in_id: string;
}

export interface ContractScopeI extends BaseSchema {
  name: string;
  is_within_scope: boolean;
  src_start_pos: number;
  src_end_pos: number;
  source_defined_in_id: string;
  functions: FunctionScopeI[];
}

export interface TreeResponseI extends BaseSchema {
  path: string;
  is_imported: boolean;
  is_known_target: boolean;
  is_within_scope: boolean;
  contracts: ContractScopeI[];
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

export interface AuditStatusResponseI {
  id: string;
  status: string;
}

export interface UserSearchResponseI {
  id: string;
  address: string;
  permissions?: {
    can_create_api_key: boolean;
    can_create_app: boolean;
  };
}

export interface AppSearchResponseI {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  permissions?: {
    can_create_api_key: boolean;
    can_create_app: boolean;
  };
}

export interface PromptResponseI {
  id: string;
  created_at: string;
  audit_type: string;
  tag: string;
  version: string;
  content: string;
  is_active: boolean;
}

export interface AuditWithChildrenResponseI {
  id: string;
  created_at: string;
  status: AuditStatus;
  project_id: string;
  version_id: string;
  level: string;
  processing_time_seconds: number;
  logic_version: string;
  n_findings: number;
  n_failures: number;
  markdown: string;
  findings: FindingI[];
}

export interface ChatMessageI {
  id: string;
  role: "user" | "system";
  timestamp: string;
  content: string;
  tools_called?: string[];
}

export interface ChatResponseI {
  id: string;
  created_at: string;
  user_id: string;
  audit_id: string;
  is_visible: boolean;
  total_messages: number;
}

export interface ChatMessagesResponseI extends ChatResponseI {
  messages: ChatMessageI[];
}

export interface ChatWithAuditResponseI extends ChatResponseI {
  audit: {
    id: string;
    created_at: string;
    status: AuditStatus;
    version: string;
    audit_type: string;
    processing_time_seconds: number;
    result: string;
    introduction?: string;
    scope?: string;
    conclusiong?: string;
    contract: {
      id: string;
      method: string;
      address: string;
      network: string;
      code: string;
      is_available: boolean;
    };
  };
}

export interface TeamSchemaI extends BaseSchema {
  name: string;
  is_default: boolean;
  created_by_user_id: string | null;
  slug: string;
  role: MemberRoleEnum;
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
  permissions: {
    project: "read" | "write" | "none";
    contract: "read" | "write" | "none";
    audit: "read" | "write" | "none";
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

export interface MemberSchema extends BaseSchema {
  team_id: string;
  user_id: string;
  role: MemberRoleEnum;
  identifier: string;
  can_remove: boolean;
  can_update: boolean;
}

export interface CodeProjectSchema extends BaseSchema {
  team_id: string;
  name: string;
  slug: string;
  description?: string;
  tags: string[];
  n_versions: number;
  n_audits: number;
}

export interface InitialUserObject {
  isAuthenticated: boolean;
  userId?: string;
  teams: TeamSchemaI[];
  projects: CodeProjectSchema[];
}

export interface MemberInviteSchema extends BaseSchema {
  user_id?: string;
  identifier: string;
  role: MemberRoleEnum;
  team: TeamSchemaI;
}

export interface CodeVersionSchema extends BaseSchema {
  network?: string;
  version_method: string;
  version_identifier: string;
  source_type: SourceTypeEnum;
  source_url?: string;
  solc_version?: string;
  is_code_available: boolean;
}

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

export type HrefProps = {
  teamSlug?: string;
  projectSlug?: string;
  versionId?: string;
  auditId?: string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type AsyncComponent<P = {}> = AsyncFunctionComponent<P>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AsyncFunctionComponent<P = {}> {
  (props: P): Promise<JSX.Element>;
}
