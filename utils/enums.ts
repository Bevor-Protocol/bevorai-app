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

export enum FindingType {
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
