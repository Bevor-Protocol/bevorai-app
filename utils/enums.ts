export enum TerminalStep {
  INITIAL = "INITIAL",
  INPUT_ADDRESS = "INPUT_ADDRESS",
  INPUT_UPLOAD = "INPUT_UPLOAD",
  INPUT_FOLDER = "INPUT_FOLDER",
  INPUT_PASTE = "INPUT_PASTE",
  SCOPE_DEFINITION = "SCOPE_DEFINITION",
  INPUT_AGENT = "INPUT_AGENT",
  AUDIT_TYPE = "AUDIT_TYPE",
  RESULTS = "RESULTS",
}

export enum Message {
  SYSTEM = "SYSTEM",
  ASSISTANT = "ASSISTANT",
  USER = "USER",
  ERROR = "ERROR",
}

export enum FindingLevel {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export enum AnalysisStatus {
  WAITING = "waiting",
  PROCESSING = "processing",
  SUCCESS = "success",
  FAILED = "failed",
}

export enum PlanStatusEnum {
  ACTIVE = "active",
  CANCELED = "canceled",
  INCOMPLETE = "incomplete",
  INCOMPLETE_EXPIRED = "incomplete_expired",
  PAST_DUE = "past_due",
  TRIALING = "trialing",
  UNPAID = "unpaid",
  PAUSED = "paused",
}

export enum AnalysisUpdateMethodEnum {
  MANUAL = "manual",
  AUTO_USER = "automatic_for_user",
  AUTO_ALL = "automatic_for_all",
}
