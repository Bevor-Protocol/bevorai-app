// graph-api.responses.ts — JSON response bodies only; base path /graph

import { UserSchema } from "@/types/api/responses/business";
import { ChatSchema } from "@/types/api/responses/chat";
import { GithubCommitSchema, GithubRepositorySchema } from "@/types/api/responses/github";

export type CodeVersionStatus = "waiting" | "processing" | "failed" | "success";
export type VersionMethod = "tag" | "commit" | "hash" | "address";
export type Network =
  | "eth"
  | "bsc"
  | "polygon"
  | "base"
  | "avax"
  | "mode"
  | "arb"
  | "eth_sepolia"
  | "bsc_test"
  | "polygon_amoy"
  | "base_sepolia"
  | "avax_fuji"
  | "mode_testnet"
  | "arb_sepolia";

export type Language = "solidity" | "rust";
export type EdgeType =
  | "uses"
  | "calls"
  | "calls_external"
  | "reads"
  | "writes"
  | "inherits"
  | "overrides"
  | "emits"
  | "throws"
  | "defines"
  | "initializes"
  | "accesses"
  | "has_constraint"
  | "has_access_control"
  | "references"
  | "implements"
  | "extends"
  | "has_ref_comment";

export type Visibility = "external" | "public" | "internal" | "private";

export enum SourceTypeEnum {
  SCAN = "scan",
  PASTE = "paste",
  UPLOAD_FILE = "upload_file",
  UPLOAD_FOLDER = "upload_folder",
  REPOSITORY = "repository",
}

export interface CodeVersionSchema {
  id: string;
  network: Network | null;
  version_method: VersionMethod;
  version_identifier: string;
  source_type: SourceTypeEnum;
  status: CodeVersionStatus;
  name?: string;
  branch?: string;
  commit: GithubCommitSchema | null;
  repository: GithubRepositorySchema | null;
}

export interface CodeMappingSchema extends CodeVersionSchema {
  created_at: string;
  project_id: string;
  project_slug: string;
  user: UserSchema;
  is_private: boolean;
  parent_id?: string;
  inferred_name: string;
}

export interface CodeVersionMappingIndex extends CodeMappingSchema {
  n: number;
}

export interface CreateCodeMappingResponse {
  id: string;
  status: CodeVersionStatus;
}

export interface RelationSchema {
  parent: CodeMappingSchema | null;
  children: CodeMappingSchema[];
}

export interface SimilaritiesSchema {
  score: number;
  version: CodeMappingSchema;
}

export interface ChatFullSchema extends ChatSchema {
  code_version: CodeMappingSchema;
}

export interface EntityMatch {
  id: string;
  name?: string;
  source: string;
  tool_name?: string;
}

export interface EntityUnmatched {
  type: string;
  name: string;
  confidence: string;
}

export interface EntitiesResponse {
  intent: string;
  matched: EntityMatch[];
  unmatched: EntityUnmatched[];
}

export interface SigningKeyResponse {
  signing_key: string;
}

export interface TextContentResponse {
  content: string;
}

/** call-chain + formatted call-chain */
export interface CallChainJsonResponse {
  result: unknown;
}

export interface ConstraintItem {
  name: string;
  value?: string | string[];
}

export interface FieldMetadataItem {
  name: string;
  type?: string;
  value?: string;
  mutability?: string;
  discriminant?: number | null;
  constraints: ConstraintItem[];
}

export interface CallBinding {
  param_index: number;
  param_name: string;
  bound_to_node_id?: string;
  bound_to_name?: string;
  is_known_storage: boolean;
  type_name?: string;
  bound_to_field?: string;
}

export interface ReturnStorageMetadata {
  param_ind: number;
  param_name?: string;
  bound_to_name?: string;
  is_known_storage: boolean;
  bound_to_field?: string;
  type_name?: string;
}

export interface ParameterStorageMetadata {
  param_index: number;
  param_name?: string;
  is_known_storage: boolean;
  is_read: boolean;
  is_written: boolean;
  read_fields: string[];
  write_fields: string[];
  type_name?: string;
}

export interface DirectStorageMetadata {
  storage_method: "transient" | "persistent" | "instance";
  slot_name?: string;
  is_known_storage: boolean;
  is_read: boolean;
  is_written: boolean;
}

export interface GraphSnapshotFile {
  id: string;
  code_version_id: string;
  language: Language;
  path: string;
  is_dependency: boolean;
  is_config: boolean;
  is_test: boolean;
  is_script: boolean;
  labels: string[];
  include_in_graph: boolean;
}

export interface GraphSnapshotNode {
  id: string;
  file_id: string;
  node_type: string;
  sub_type?: string;
  src_start_pos: number;
  src_end_pos: number;
  path: string;
  docstring?: string;
  name: string;
  merkle_hash: string;
  visibility: Visibility | null;
  mutability?: string;
  is_virtual: boolean;
  is_implemented: boolean;
  signature?: string;
  is_callable: boolean;
  is_declaration: boolean;
  is_container: boolean;
  fields: FieldMetadataItem[];
  parameters: ParameterStorageMetadata[];
  returns: ReturnStorageMetadata[];
  storages: DirectStorageMetadata[];
}

export interface GraphSnapshotEdge {
  id: string;
  code_version_id: string;
  src_id: string;
  dst_id: string;
  edge_type: EdgeType;
  src_start_pos: number;
  call_bindings: CallBinding[];
  src_field_names: string[];
  dst_field_names: string[];
}

export interface GraphSnapshot {
  code_version_id: string;
  files: GraphSnapshotFile[];
  nodes: GraphSnapshotNode[];
  edges: GraphSnapshotEdge[];
}

export interface TreeFunction {
  id: string;
  name: string;
  is_auditable: boolean;
  is_within_scope: boolean;
  src_start_pos: number;
  src_end_pos: number;
  source_id: string;
}

export interface TreeContract {
  id: string;
  name: string;
  n_auditable_fct: number;
  functions: TreeFunction[];
  is_within_scope: boolean;
  src_start_pos: number;
  src_end_pos: number;
  source_id: string;
}

export interface TreeFile {
  id: string;
  path: string;
  is_dependency: boolean;
  is_config: boolean;
  is_test: boolean;
  is_script: boolean;
  labels: string[];
  include_in_graph: boolean;
  n_auditable_fct: number;
  contracts: TreeContract[];
  is_within_scope: boolean;
}
