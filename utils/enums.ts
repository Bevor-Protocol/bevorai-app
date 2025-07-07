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

export enum AuditStatus {
  WAITING = "waiting",
  PROCESSING = "processing",
  SUCCESS = "success",
  FAILED = "failed",
}
