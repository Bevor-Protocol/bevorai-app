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
