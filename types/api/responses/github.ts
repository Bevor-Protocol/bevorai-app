export interface GithubOauthUrlQuery {
  team_slug?: string | null;
}

export interface GithubUrlResponse {
  url: string;
}

export interface GithubCallbackResponse {
  success: true;
  team_slug: string | null;
}

interface GitHubRepositoryOwner {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  html_url: string;
  type: "User" | "Organization";
}

interface GitHubRepositoryPermissions {
  admin: boolean;
  push: boolean;
  pull: boolean;
}

interface GitHubRepositoryLicense {
  key: string;
  name: string;
  url?: string | null;
  spdx_id?: string | null;
  node_id?: string | null;
  html_url?: string | null;
}

interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  owner: GitHubRepositoryOwner;
  private: boolean;
  html_url: string;
  description?: string | null;
  fork: boolean;
  url: string;
  default_branch: string;
  visibility?: "public" | "private" | "internal" | null;
  created_at?: string | null; // ISO datetime string
  updated_at?: string | null; // ISO datetime string
  pushed_at?: string | null; // ISO datetime string
  permissions?: GitHubRepositoryPermissions | null;
  license?: GitHubRepositoryLicense | null;
  language?: string | null;
  forks_count?: number | null;
  stargazers_count?: number | null;
  watchers_count?: number | null;
  open_issues_count?: number | null;
  topics: string[];
  archived?: boolean | null;
  disabled?: boolean | null;
}

interface GithubInstallationAccount {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  html_url: string;
  type: "User" | "Organization";
}

interface GithubInstallationResponse {
  id: number;
  account: GithubInstallationAccount;
  access_tokens_url: string;
  repositories_url: string;
  html_url: string;
  app_id: number;
  target_id: number;
  client_id: string;
  target_type: "User" | "Organization";
  permissions: {
    [key: string]: "read" | "write" | "admin";
  }[];
  events: string[];
  repository_selection: "all" | "selected";
  created_at: string;
  updated_at: string;
  suspended_at?: string;
}

export interface GithubRepositoriesResponse {
  total_count: number;
  repositories: GitHubRepository[];
}

export interface GithubInstallationsResponse {
  total_count: number;
  installations: GithubInstallationResponse[];
}

/** GitHub-installation payloads are large; tighten when you copy from shared/lib/clients/github/interface.py */
export interface GithubUserBaseSchema {
  is_authenticated: boolean;
}

export interface GithubUserInstallationsSchema extends GithubUserBaseSchema {
  installation_info?: GithubInstallationsResponse;
}

export interface GithubUserRepositoriesSchema extends GithubUserBaseSchema {
  repository_info?: GithubRepositoriesResponse;
}

export interface GithubUserRepoBranchesSchema extends GithubUserBaseSchema {
  is_member: boolean;
  branches_info: {
    name: string;
    commit: {
      sha: string;
      url: string;
    };
    protected: boolean;
  }[];
}

export interface GithubCommitSchema {
  sha: string;
  author: string;
  message: string;
  timestamp: string;
}

export interface GithubAccountSchema {
  id: number;
  login: string;
  type: string;
  url: string;
  avatar_url: string;
}

export interface GithubRepositorySchema {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  is_private: boolean;
  account: GithubAccountSchema;
  full_name: string;
  url: string;
}
