import { type SiweMessage } from "siwe";
import { AuditStatus, FindingLevel, Message } from "./enums";

export type MessageType = {
  type: Message;
  content: string;
};

export type SiweStateI = {
  isPending: boolean;
  isSuccess: boolean;
  login: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
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

export interface SessionData {
  siwe?: SiweMessage;
  nonce?: string;
  user_id?: string;
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

interface AuditObservationI {
  n: number;
  id: string;
  created_at: string;
  status: string;
  logic_version: string;
  processing_time_seconds: number;
  contract: {
    id: string;
    source_type: string;
    target: string;
    network?: string;
    solc_version: string;
  };
  user: {
    id: string;
    address: string;
  };
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

export interface UserI {
  id: string;
  address: string;
}

export interface AuditResponseI {
  id: string;
  created_at: string;
  project_id: string;
  version_id: string;
  status: AuditStatus;
  processing_time_seconds: number;
  level: string;
  logic_version: string;
  n_findings: number;
  n_failures: number;
  markdown: string;
  findings: FindingI[];
  user: UserI;
}

export interface UserInfoResponseI {
  id: string;
  address: string;
  created_at: string;
  total_credits: number;
  remaining_credits: number;
  auth: {
    exists: boolean;
    is_active: boolean;
    can_create: boolean;
  };
  app: {
    exists: boolean;
    name?: string;
    can_create: boolean;
    exists_auth: boolean;
    can_create_auth: boolean;
  };
  n_audits: number;
  n_projects: number;
  n_versions: number;
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

export interface ContractVersionI {
  network?: string;
  source_type: string;
  target: string;
  solc_version: string;
  block_explorer_url: string;
}

export interface TreeResponseI {
  id: string;
  sources: {
    id: string;
    path: string;
    is_imported: boolean;
    is_known_target: boolean;
    contracts: {
      id: string;
      name: string;
      functions: {
        id: string;
        name: string;
        is_inherited: boolean;
        is_auditable: boolean;
        is_entry_point: boolean;
        is_override: boolean;
        contract_name_defined: string;
      }[];
    }[];
  }[];
}

export interface ContractSourceResponseI {
  id: string;
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
