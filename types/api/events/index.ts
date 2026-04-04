import type { ActivitySchema, MemberRoleEnum, TeamSchema } from "@/types/api/responses/business";
import type { CodeVersionStatus } from "@/types/api/responses/graph";
import type {
  AnalysisNodeStatus,
  FindingLevelEnum,
  FindingTypeEnum,
} from "@/types/api/responses/security";

export type PubSubMessageType =
  | "chat.title"
  | "team.invite"
  | "code.status"
  | "analysis.new"
  | "analysis.status"
  | "analysis.scope"
  | "activity.new"
  | "shutdown";

export interface TeamInviteEventData {
  id: string;
  created_at: string;
  user_id?: string | null;
  identifier: string;
  role: MemberRoleEnum;
  team: TeamSchema;
}

export interface ChatTitleEventData {
  id: string;
  title: string;
  team: TeamSchema;
}

export interface CodeStatusEventData {
  id: string;
  status: CodeVersionStatus;
  team: TeamSchema;
}

export interface AnalysisNewEventData {
  id: string;
}

export interface FindingEventData {
  id: string;
  source_node_id: string;
  type: FindingTypeEnum;
  level: FindingLevelEnum;
  name: string;
  explanation: string;
  recommendation: string;
  reference: string;
  locations: string[];
  /** Node ids of entry-point scopes affected by this finding */
  affected_scopes?: string[];
}

export interface AnalysisScopeStatusEventData {
  id: string;
  analysis_id: string;
  team: TeamSchema;
  status: AnalysisNodeStatus;
  findings: FindingEventData[];
}

export interface AnalysisStatusEventData {
  id: string;
  status: AnalysisNodeStatus;
  team: TeamSchema;
}

export type ActivityEventData = ActivitySchema;

export type PubSubMessage =
  | { type: "chat.title"; data: ChatTitleEventData }
  | { type: "team.invite"; data: TeamInviteEventData }
  | { type: "code.status"; data: CodeStatusEventData }
  | { type: "analysis.new"; data: AnalysisNewEventData }
  | { type: "analysis.status"; data: AnalysisStatusEventData }
  | { type: "analysis.scope"; data: AnalysisScopeStatusEventData }
  | { type: "activity.new"; data: ActivityEventData }
  | { type: "shutdown"; data: null };

export const PUBSUB_MESSAGE_TYPES: PubSubMessageType[] = [
  "chat.title",
  "team.invite",
  "code.status",
  "analysis.new",
  "analysis.status",
  "analysis.scope",
  "activity.new",
  "shutdown",
];

export function isPubSubMessageType(value: string): value is PubSubMessageType {
  return (PUBSUB_MESSAGE_TYPES as string[]).includes(value);
}
