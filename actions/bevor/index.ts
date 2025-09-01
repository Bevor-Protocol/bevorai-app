"use server";

import apiKeyService from "@/actions/bevor/api-key.service";
import {
  AppSearchResponseI,
  AuditFindingsResponseI,
  AuditSchemaI,
  AuditStatusResponseI,
  AuditTableReponseI,
  AuditWithChildrenResponseI,
  AuthSchema,
  ChatMessagesResponseI,
  ChatResponseI,
  ChatWithAuditResponseI,
  CodeProjectSchema,
  CodeVersionSchema,
  ContractResponseI,
  ContractSourceResponseI,
  ContractVersionSourceI,
  ContractVersionSourceTrimI,
  CreateKeyBody,
  CreateProjectBody,
  CreateTeamBody,
  CreditSyncResponseI,
  FunctionChunkResponseI,
  InviteMemberBody,
  MemberInviteSchema,
  MemberSchema,
  MultiTimeseriesResponseI,
  PromptResponseI,
  StatsResponseI,
  StripeAddonI,
  StripeCustomerI,
  StripePlanI,
  StripeSubscriptionI,
  TeamSchemaI,
  TimeseriesResponseI,
  TreeResponseI,
  UpdateMemberBody,
  UpdateSubscriptionRequest,
  UpdateTeamBody,
  UserInfoResponseI,
  UserSchemaI,
  UserSearchResponseI,
  UserTimeseriesResponseI,
} from "@/utils/types";
import adminService from "./admin.service";
import auditService from "./audit.service";
import billingService from "./billing.service";
import chatService from "./chat.service";
import projectService from "./project.service";
import teamService from "./team.service";
import userService from "./user.service";
import versionService from "./version.service";

// Admin Operations
const isAdmin = async (): Promise<boolean> => {
  return adminService.isAdmin();
};

const searchUsers = async (identifier: string): Promise<UserSearchResponseI[]> => {
  return adminService.searchUsers(identifier);
};

const searchApps = async (identifier: string): Promise<AppSearchResponseI[]> => {
  return adminService.searchApps(identifier);
};

const getAuditWithChildren = async (id: string): Promise<AuditWithChildrenResponseI> => {
  return adminService.getAuditWithChildren(id);
};

const updateUserPermissions = async (data: {
  toUpdateId: string;
  canCreateApp: boolean;
  canCreateApiKey: boolean;
}): Promise<boolean> => {
  return adminService.updateUserPermissions(data);
};

const updateAppPermissions = async (data: {
  toUpdateId: string;
  canCreateApp: boolean;
  canCreateApiKey: boolean;
}): Promise<boolean> => {
  return adminService.updateAppPermissions(data);
};

const getPrompts = async (): Promise<PromptResponseI[]> => {
  return adminService.getPrompts();
};

const addPrompt = async (data: {
  audit_type: string;
  tag: string;
  content: string;
  version: string;
  is_active?: boolean;
}): Promise<string> => {
  return adminService.addPrompt(data);
};

const updatePrompt = async (data: {
  promptId: string;
  tag?: string;
  content?: string;
  version?: string;
  is_active?: boolean;
}): Promise<boolean> => {
  return adminService.updatePrompt(data);
};

// Audit Operations
const initiateAudit = async (
  versionId: string,
  scopes: { identifier: string; level: string }[],
): Promise<{
  id: string;
  status: string;
}> => {
  return auditService.initiateAudit(versionId, scopes);
};

const getAudit = async (auditId: string): Promise<AuditSchemaI> => {
  return auditService.getAudit(auditId);
};

const getAuditFindings = async (auditId: string): Promise<AuditFindingsResponseI> => {
  return auditService.getAuditFindings(auditId);
};

const getAuditScope = async (auditId: string): Promise<TreeResponseI[]> => {
  return auditService.getAuditScope(auditId);
};

const getAuditStatus = async (id: string): Promise<AuditStatusResponseI> => {
  return auditService.getAuditStatus(id);
};

const submitFeedback = async (
  id: string,
  feedback?: string,
  verified?: boolean,
): Promise<{ success: boolean }> => {
  return auditService.submitFeedback(id, feedback, verified);
};

const getAudits = async (filters: { [key: string]: string }): Promise<AuditTableReponseI> => {
  return auditService.getAudits(filters);
};

// Contract Operations
const contractUploadFolder = async (fileMap: Record<string, File>): Promise<ContractResponseI> => {
  return versionService.contractUploadFolder(fileMap);
};

const contractUploadFile = async (file: File): Promise<ContractResponseI> => {
  return versionService.contractUploadFile(file);
};

const contractUploadScan = async (
  address: string,
  projectId: string,
): Promise<ContractResponseI> => {
  return versionService.contractUploadScan({
    address,
    projectId,
  });
};

const contractUploadPaste = async (code: string): Promise<ContractResponseI> => {
  return versionService.contractUploadPaste(code);
};

const getContractVersion = async (versionId: string): Promise<CodeVersionSchema> => {
  return versionService.getContractVersion(versionId);
};

const getContractVersionSources = async (
  versionId: string,
): Promise<ContractVersionSourceTrimI[]> => {
  return versionService.getContractVersionSources(versionId);
};

const getContractVersionSource = async (
  sourceId: string,
  versionId: string,
): Promise<ContractVersionSourceI> => {
  return versionService.getContractVersionSource(sourceId, versionId);
};

const getContractTree = async (versionId: string): Promise<TreeResponseI[]> => {
  return versionService.getContractTree(versionId);
};

const getContractSources = async (versionId: string): Promise<ContractSourceResponseI[]> => {
  return versionService.getContractSources(versionId);
};

const getFunctionChunk = async (functionId: string): Promise<FunctionChunkResponseI> => {
  return versionService.getFunctionChunk(functionId);
};

// Chat Operations
const initiateChat = async (auditId: string): Promise<ChatResponseI> => {
  return chatService.initiateChat(auditId);
};

const getChats = async (): Promise<ChatWithAuditResponseI[]> => {
  return chatService.getChats();
};

const getChat = async (chatId: string): Promise<ChatMessagesResponseI> => {
  return chatService.getChat(chatId);
};

// Team Operations
const createTeam = async (data: CreateTeamBody): Promise<TeamSchemaI> => {
  return teamService.createTeam(data);
};

const getTeam = async (): Promise<TeamSchemaI> => {
  return teamService.getTeam();
};

const getTeams = async (): Promise<TeamSchemaI[]> => {
  return teamService.getTeams();
};

const deleteTeam = async (): Promise<boolean> => {
  return teamService.deleteTeam();
};

const updateTeam = async (data: UpdateTeamBody): Promise<TeamSchemaI> => {
  return teamService.updateTeam(data);
};

const getInvites = async (): Promise<MemberInviteSchema[]> => {
  return teamService.getInvites();
};

const inviteMembers = async (data: InviteMemberBody): Promise<boolean> => {
  return teamService.inviteMembers(data);
};

const removeInvite = async (inviteId: string): Promise<boolean> => {
  return teamService.removeInvite(inviteId);
};

const acceptInvite = async (inviteId: string): Promise<string> => {
  return teamService.acceptInvite(inviteId);
};

const updateMember = async (memberId: string, data: UpdateMemberBody): Promise<boolean> => {
  return teamService.updateMember(memberId, data);
};

const removeMember = async (memberId: string): Promise<boolean> => {
  return teamService.removeMember(memberId);
};

const getMembers = async (): Promise<MemberSchema[]> => {
  return teamService.getMembers();
};

const getCurrentMember = async (): Promise<MemberSchema> => {
  return teamService.getCurrentMember();
};

// Project Operations
const createProject = async (data: CreateProjectBody): Promise<CodeProjectSchema> => {
  return projectService.createProject(data);
};

const getProjects = async (): Promise<CodeProjectSchema[]> => {
  return projectService.getProjects();
};

const getProject = async (projectId: string): Promise<CodeProjectSchema> => {
  return projectService.getProject(projectId);
};

const getProjectBySlug = async (projectSlug: string): Promise<CodeProjectSchema> => {
  return projectService.getProjectBySlug(projectSlug);
};

const getAllProjects = async (): Promise<CodeProjectSchema[]> => {
  return projectService.getAllProjects();
};

const deleteProject = async (projectId: string): Promise<boolean> => {
  return projectService.deleteProject(projectId);
};

const getVersions = async (projectId: string): Promise<CodeVersionSchema[]> => {
  return projectService.getVersions(projectId);
};

// User Operations
const getUser = async (): Promise<UserSchemaI | null> => {
  return userService.getUser();
};
const syncCredits = async (): Promise<CreditSyncResponseI> => {
  return userService.syncCredits();
};

const getCurrentGas = async (): Promise<number> => {
  return userService.getCurrentGas();
};

const getStats = async (): Promise<StatsResponseI> => {
  return userService.getStats();
};

const getTimeseriesAudits = async (): Promise<TimeseriesResponseI> => {
  return userService.getTimeseriesAudits();
};

const getTimeseriesContracts = async (): Promise<TimeseriesResponseI> => {
  return userService.getTimeseriesContracts();
};

const getTimeseriesUsers = async (): Promise<TimeseriesResponseI> => {
  return userService.getTimeseriesUsers();
};

const getTimeseriesFindings = async (type: string): Promise<MultiTimeseriesResponseI> => {
  return userService.getTimeseriesFindings(type);
};

const getUserInfo = async (): Promise<UserInfoResponseI> => {
  return userService.getUserInfo();
};

const getUserInvites = async (): Promise<MemberInviteSchema[]> => {
  return userService.getUserInvites();
};

const getUserTimeSeries = async (): Promise<UserTimeseriesResponseI> => {
  return userService.getUserTimeSeries();
};

const getProducts = async (): Promise<StripePlanI[]> => {
  return billingService.getProducts();
};

const getAddons = async (): Promise<StripeAddonI[]> => {
  return billingService.getAddons();
};

const getSubscription = async (): Promise<StripeSubscriptionI> => {
  return billingService.getSubscription();
};

const modifySubscription = async (lookupKey: string): Promise<StripeSubscriptionI> => {
  return billingService.modifySubscription(lookupKey);
};

const getCustomer = async (): Promise<StripeCustomerI> => {
  return billingService.getCustomer();
};

const updateCustomer = async (data: {
  name?: string;
  email?: string;
}): Promise<StripeCustomerI> => {
  return billingService.updateCustomer(data);
};

const createCheckoutSession = async (data: {
  success_url: string;
  cancel_url: string;
}): Promise<{ session_id: string; url: string }> => {
  return billingService.createCheckoutSession(data);
};

const updateSubscription = async (data: UpdateSubscriptionRequest): Promise<boolean> => {
  return billingService.updateSubscription(data);
};

const cancelSubscription = async (): Promise<boolean> => {
  return billingService.cancelSubscription();
};

const reactivateSubscription = async (): Promise<boolean> => {
  return billingService.reactivateSubscription();
};

const listKeys = async (): Promise<AuthSchema[]> => {
  return apiKeyService.listKeys();
};

const createKey = async (data: CreateKeyBody): Promise<{ api_key: string }> => {
  return apiKeyService.createKey(data);
};

const refreshKey = async (keyId: string): Promise<{ api_key: string }> => {
  return apiKeyService.refreshKey(keyId);
};

const revokeKey = async (keyId: string): Promise<boolean> => {
  return apiKeyService.revokeKey(keyId);
};

export {
  acceptInvite,
  addPrompt,
  cancelSubscription,
  contractUploadFile,
  contractUploadFolder,
  contractUploadPaste,
  contractUploadScan,
  createCheckoutSession,
  createKey,
  createProject,
  createTeam,
  deleteProject,
  deleteTeam,
  getAddons,
  getAllProjects,
  getAudit,
  getAuditFindings,
  getAudits,
  getAuditScope,
  getAuditStatus,
  getAuditWithChildren,
  getChat,
  getChats,
  getContractSources,
  getContractTree,
  getContractVersion,
  getContractVersionSource,
  getContractVersionSources,
  getCurrentGas,
  getCurrentMember,
  getCustomer,
  getFunctionChunk,
  getInvites,
  getMembers,
  getProducts,
  getProject,
  getProjectBySlug,
  getProjects,
  getPrompts,
  getStats,
  getSubscription,
  getTeam,
  getTeams,
  getTimeseriesAudits,
  getTimeseriesContracts,
  getTimeseriesFindings,
  getTimeseriesUsers,
  getUser,
  getUserInfo,
  getUserInvites,
  getUserTimeSeries,
  getVersions,
  initiateAudit,
  initiateChat,
  inviteMembers,
  isAdmin,
  listKeys,
  modifySubscription,
  reactivateSubscription,
  refreshKey,
  removeInvite,
  removeMember,
  revokeKey,
  searchApps,
  searchUsers,
  submitFeedback,
  syncCredits,
  updateAppPermissions,
  updateCustomer,
  updateMember,
  updatePrompt,
  updateSubscription,
  updateTeam,
  updateUserPermissions,
};
