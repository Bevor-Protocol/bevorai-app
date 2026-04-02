// security-api.responses.ts — JSON bodies only; base path /security

import { UserSchema } from "@/types/api/responses/business";
import { ChatSchema } from "@/types/api/responses/chat";
import { CodeMappingSchema, GraphSnapshotNode } from "@/types/api/responses/graph";

// --- enums ---

export type AnalysisNodeStatus = "waiting" | "processing" | "success" | "failed" | "partial";

export type FindingOperation = "add" | "update" | "delete";

export type AnalysisTrigger = "manual_run" | "chat" | "manual_edit" | "fork" | "merge";

export type FindingDraftState = "add" | "update" | "delete";

export enum FindingStatusEnum {
  UNRESOLVED = "unresolved",
  INVALIDATED = "invalidated",
  VALIDATED = "validated",
  REMEDIATED = "remediated",
}

export enum FindingLevelEnum {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export enum FindingTypeEnum {
  ACCESS_CONTROL = "access_control",
  AUTHORIZATION = "authorization",
  REENTRANCY = "reentrancy",
  ARITHMETIC = "arithmetic",
  INPUT_VALIDATION = "input_validation",
  LOGIC = "logic",
  DOS = "dos",
  UPGRADEABILITY = "upgradeability",
  ECONOMIC = "economic",
  ORACLE = "oracle",
  STATE_EXPOSURE = "state_exposure",
  GAS = "gas",
}

export type Visibility = "external" | "public" | "internal" | "private";

export interface AnalysisFinding {
  type: FindingTypeEnum;
  level: FindingLevelEnum;
  name: string;
  explanation: string;
  recommendation?: string;
  reference?: string;
}

export interface FindingLocationSchema {
  source_node_id: string;
  field_name?: string;
}

export interface FindingSchema extends AnalysisFinding {
  id: string;
  team_id: string;
  team_slug: string;
  project_id: string;
  project_slug: string;
  analysis_id: string;
  code_version_id: string;
  node_id: string;
  user_id: string;
  status: FindingStatusEnum;
  feedback?: string;
  locations: FindingLocationSchema[];
  source_node_id: string;
  validated_at?: string;
  invalidated_at?: string;
}

export interface DraftFindingSchema extends FindingSchema {
  is_draft: boolean;
  operation?: FindingOperation;
  base_finding_id?: string;
}

export interface KanbanFindingSchema extends FindingSchema {
  user: UserSchema;
}

export interface DraftedFindingSchema extends FindingSchema {
  is_draft: boolean;
  draft_type: FindingDraftState;
  base_finding_id?: string;
}

export interface ScopeSchema extends GraphSnapshotNode {
  source_node_id: string;
  status: AnalysisNodeStatus;
}

export interface AnalysisNodeSchema {
  id: string;
  created_at: string;
  user: UserSchema;
  team_id: string;
  team_slug: string;
  project_id: string;
  project_slug: string;
  is_owner: boolean;
  trigger: AnalysisTrigger;
  status: AnalysisNodeStatus;
  n_findings: number;
  n_scopes: number;
  code_version_id: string;
  is_leaf: boolean;
  is_public: boolean;
  root_node_id: string;
  merged_from_node_id?: string;
  parent_node_id?: string;
  children: string[];
  findings: FindingSchema[];
  scopes: ScopeSchema[];
}

export interface AnalysisNodeIndex extends AnalysisNodeSchema {
  n: number;
}

export interface AnalysisEdgeSchema {
  source: string;
  target: string;
}

export interface AnalysisDagSchema {
  nodes: AnalysisNodeSchema[];
  edges: AnalysisEdgeSchema[];
}

/** Security service: full chat includes code mapping + optional analysis node */
export interface ChatFullSchema extends ChatSchema {
  code_version: CodeMappingSchema;
  analysis_node: AnalysisNodeSchema | null;
}
