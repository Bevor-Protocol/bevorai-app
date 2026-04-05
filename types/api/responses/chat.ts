import { ProjectSchema, TeamSchema, UserSchema } from "@/types/api/responses/business";

export type ChatRole = "user" | "system";
export type ChatType = "code" | "analysis";

export interface ChatResponseSchema {
  message: string;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  is_pending_approval?: boolean;
}

export interface ChatMessageSchema {
  id: string;
  created_at: string;
  chat_id: string;
  chat_role: ChatRole;
  message: string;
  tools: ToolCall[];
  code_version_id: string;
  analysis_id: string | null;
  references: { id: string; name?: string }[];
}

export interface ChatSchema {
  id: string;
  created_at: string;
  team: TeamSchema;
  project: ProjectSchema;
  user: UserSchema;
  total_messages: number;
  code_version_id: string;
  analysis_id: string | null;
  title: string | null;
  chat_type: ChatType;
}

export interface ChatIndex extends ChatSchema {
  n: number;
}
