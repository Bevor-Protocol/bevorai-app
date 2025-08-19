"use server";

import apiKeyService from "@/actions/bevor/api-key.service";
import tokenService from "@/actions/bevor/token.service";
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
  TeamSchemaI,
  TimeseriesResponseI,
  TreeResponseI,
  UpdateMemberBody,
  UpdateTeamBody,
  UserInfoResponseI,
  UserSchemaI,
  UserSearchResponseI,
  UserTimeseriesResponseI,
} from "@/utils/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import adminService from "./admin.service";
import auditService from "./audit.service";
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
const createTeam = async (data: CreateTeamBody): Promise<string> => {
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
const createProject = async (data: CreateProjectBody): Promise<string> => {
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

const getUserTimeSeries = async (): Promise<UserTimeseriesResponseI> => {
  return userService.getUserTimeSeries();
};

const listKeys = async (): Promise<AuthSchema[]> => {
  return apiKeyService.listKeys();
};

const createKey = async (name: string): Promise<{ api_key: string }> => {
  return apiKeyService.createKey({ name });
};

const refreshKey = async (keyId: string): Promise<{ api_key: string }> => {
  return apiKeyService.refreshKey(keyId);
};

const revokeKey = async (keyId: string): Promise<boolean> => {
  return apiKeyService.revokeKey(keyId);
};

const login = async (idpUserId: string): Promise<void> => {
  // in response to some user action. Not accessible in middleware
  console.log("IS LOGGING USER IN");
  await userService.createUser(idpUserId);
  const token = await tokenService.issueToken();
  await tokenService.setSessionToken(token);
  // const teams = await teamService.getTeams();

  // redirect here, instead of on the client. This ensures the cookie is available in the middleware
  redirect("/teams");
};

const logout = async (): Promise<void> => {
  // in response to some user action. Not accessible in middleware
  console.log("logging user out");
  const cookieStore = await cookies();
  await tokenService.revokeToken();
  // called in conjunction with IDP, don't worry about delete their cookies
  cookieStore.delete("bevor-token");
  cookieStore.delete("bevor-refresh-token");
  cookieStore.delete("bevor-recent-team");

  redirect("/sign-in");
};

export {
  acceptInvite,
  addPrompt,
  contractUploadFile,
  contractUploadFolder,
  contractUploadPaste,
  contractUploadScan,
  createKey,
  createProject,
  createTeam,
  deleteProject,
  deleteTeam,
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
  getFunctionChunk,
  getInvites,
  getMembers,
  getProject,
  getProjectBySlug,
  getProjects,
  getPrompts,
  getStats,
  getTeam,
  getTeams,
  getTimeseriesAudits,
  getTimeseriesContracts,
  getTimeseriesFindings,
  getTimeseriesUsers,
  getUser,
  getUserInfo,
  getUserTimeSeries,
  getVersions,
  initiateAudit,
  initiateChat,
  inviteMembers,
  isAdmin,
  listKeys,
  login,
  logout,
  refreshKey,
  removeInvite,
  removeMember,
  revokeKey,
  searchApps,
  searchUsers,
  submitFeedback,
  syncCredits,
  updateAppPermissions,
  updateMember,
  updatePrompt,
  updateTeam,
  updateUserPermissions,
};
