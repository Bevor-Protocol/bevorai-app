"use server";

import authController from "@/actions/auth/auth.controller";
import {
  AppSearchResponseI,
  AuditResponseI,
  AuditStatusResponseI,
  AuditTableReponseI,
  AuditWithChildrenResponseI,
  ChatMessagesResponseI,
  ChatResponseI,
  ChatWithAuditResponseI,
  ContractResponseI,
  ContractSourceResponseI,
  ContractVersionI,
  CreditSyncResponseI,
  FunctionChunkResponseI,
  MultiTimeseriesResponseI,
  PromptResponseI,
  StatsResponseI,
  TimeseriesResponseI,
  TreeResponseI,
  UserInfoResponseI,
  UserSearchResponseI,
  UserTimeseriesResponseI,
} from "@/utils/types";
import bevorService from "./bevor.service";

const isAdmin = async (): Promise<boolean> => {
  const user = await authController.currentUser();
  if (!user) {
    return Promise.resolve(false);
  }
  return bevorService.isAdmin(user.user_id);
};

const searchUsers = async (identifier: string): Promise<UserSearchResponseI[]> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.searchUsers(identifier, user.user_id);
};

const searchApps = async (identifier: string): Promise<AppSearchResponseI[]> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.searchApps(identifier, user.user_id);
};

const getAuditWithChildren = async (id: string): Promise<AuditWithChildrenResponseI> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.getAuditWithChildren(id, user.user_id);
};

const updateUserPermissions = async (data: {
  toUpdateId: string;
  canCreateApp: boolean;
  canCreateApiKey: boolean;
}): Promise<boolean> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.updateUserPermissions({ ...data, userId: user.user_id });
};

const updateAppPermissions = async (data: {
  toUpdateId: string;
  canCreateApp: boolean;
  canCreateApiKey: boolean;
}): Promise<boolean> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.updateAppPermissions({ ...data, userId: user.user_id });
};

const initiateAudit = async (
  projectId: string,
  versionId: string,
  scopes: { identifier: string; level: string }[],
): Promise<{
  id: string;
  status: string;
}> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.initiateAudit(projectId, versionId, scopes, user.user_id);
};

const getAudit = async (id: string): Promise<AuditResponseI> => {
  // const user = await authController.currentUser();
  // if (!user) {
  //   throw new Error("user is not signed in with ethereum");
  // }
  return bevorService.getAudit(id);
};

const getAuditStatus = async (id: string): Promise<AuditStatusResponseI> => {
  // const user = await authController.currentUser();
  // if (!user) {
  //   throw new Error("user is not signed in with ethereum");
  // }
  return bevorService.getAuditStatus(id);
};

const syncCredits = async (): Promise<CreditSyncResponseI> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.syncCredits(user.user_id);
};

const contractUploadFolder = async (fileMap: Record<string, File>): Promise<ContractResponseI> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.contractUploadFolder(fileMap, user.user_id);
};

const contractUploadFile = async (file: File): Promise<ContractResponseI> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.contractUploadFile(file, user.user_id);
};

const contractUploadScan = async (address: string): Promise<ContractResponseI> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.contractUploadScan(address, user.user_id);
};

const contractUploadPaste = async (code: string): Promise<ContractResponseI> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.contractUploadPaste(code, user.user_id);
};

const getContractVersion = async (versionId: string): Promise<ContractVersionI> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.getContractVersion(versionId, user.user_id);
};

const getContractTree = async (versionId: string): Promise<TreeResponseI> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.getContractTree(versionId, user.user_id);
};

const getContractSources = async (versionId: string): Promise<ContractSourceResponseI[]> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.getContractSources(versionId, user.user_id);
};

const getFunctionChunk = async (functionId: string): Promise<FunctionChunkResponseI> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.getFunctionChunk(functionId, user.user_id);
};

const submitFeedback = async (
  id: string,
  feedback?: string,
  verified?: boolean,
): Promise<{ success: boolean }> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.submitFeedback(id, user.user_id, feedback, verified);
};

const getCurrentGas = async (): Promise<number> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.getCurrentGas(user.user_id);
};

const getAudits = async (filters: { [key: string]: string }): Promise<AuditTableReponseI> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.getAudits(filters);
};

const getStats = async (): Promise<StatsResponseI> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.getStats();
};

const getTimeseriesAudits = async (): Promise<TimeseriesResponseI> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.getTimeseriesAudits();
};

const getTimeseriesContracts = async (): Promise<TimeseriesResponseI> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.getTimeseriesContracts();
};

const getTimeseriesUsers = async (): Promise<TimeseriesResponseI> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.getTimeseriesUsers();
};

const getTimeseriesFindings = async (type: string): Promise<MultiTimeseriesResponseI> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.getTimeseriesFindings(type);
};

const getUserInfo = async (): Promise<UserInfoResponseI> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.getUserInfo(user.user_id);
};

const getUserTimeSeries = async (): Promise<UserTimeseriesResponseI> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.getUserTimeSeries(user.user_id);
};

const generateApiKey = async (type: "user" | "app"): Promise<string> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.generateApiKey(type, user.user_id);
};

const generateApp = async (name: string): Promise<string> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.generateApp(name, user.user_id);
};

const updateApp = async (name: string): Promise<string> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.updateApp(name, user.user_id);
};

const getPrompts = async (): Promise<PromptResponseI[]> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.getPrompts(user.user_id);
};

const initiateChat = async (auditId: string): Promise<ChatResponseI> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.initiateChat(user.user_id, auditId);
};

const getChats = async (): Promise<ChatWithAuditResponseI[]> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.getChats(user.user_id);
};

const getChat = async (chatId: string): Promise<ChatMessagesResponseI> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.getChat(user.user_id, chatId);
};

const addPrompt = async (data: {
  audit_type: string;
  tag: string;
  content: string;
  version: string;
  is_active?: boolean;
}): Promise<string> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.addPrompt({ ...data, userId: user.user_id });
};

const updatePrompt = async (data: {
  promptId: string;
  tag?: string;
  content?: string;
  version?: string;
  is_active?: boolean;
}): Promise<boolean> => {
  const user = await authController.currentUser();
  if (!user) {
    throw new Error("user is not signed in with ethereum");
  }
  return bevorService.updatePrompt({ ...data, userId: user.user_id });
};

export {
  addPrompt,
  contractUploadFile,
  contractUploadFolder,
  contractUploadPaste,
  contractUploadScan,
  generateApiKey,
  generateApp,
  getAudit,
  getAudits,
  getAuditStatus,
  getAuditWithChildren,
  getChat,
  getChats,
  getContractSources,
  getContractTree,
  getContractVersion,
  getCurrentGas,
  getFunctionChunk,
  getPrompts,
  getStats,
  getTimeseriesAudits,
  getTimeseriesContracts,
  getTimeseriesFindings,
  getTimeseriesUsers,
  getUserInfo,
  getUserTimeSeries,
  initiateAudit,
  initiateChat,
  isAdmin,
  searchApps,
  searchUsers,
  submitFeedback,
  syncCredits,
  updateApp,
  updateAppPermissions,
  updatePrompt,
  updateUserPermissions,
};
