// --- Types (UUID62 and datetimes are strings on the wire) --------------------

/** Base62 or canonical UUID string */
export type AdminBooleanResponse = { success: boolean };

export type AdminMetricCount = { count: number };

export type AdminUserMicro = {
  id: string;
  username: string;
  provider: string;
  is_admin?: boolean;
};

export type AdminTeamSummary = {
  id: string;
  name: string;
  slug: string;
  plan_status: string;
  deleted_at?: string;
};

export type AdminUserListItem = {
  id: string;
  username: string;
  provider: string;
  provider_id?: string;
  is_admin?: boolean | null;
  created_at?: string;
};

export type AdminUserDetail = {
  id: string;
  username: string;
  provider: string;
  provider_id: string;
  is_admin: boolean;
  created_at?: string;
  updated_at?: string;
};

export type AdminAdminAccountRow = {
  id: string;
  username: string;
  provider: string;
  created_at?: string;
};

export type AdminTeamMembershipRow = {
  membership_id: string;
  role: string;
  joined_at?: string;
  team: AdminTeamSummary;
};

export type AdminOAuthConnectionMeta = {
  provider: string;
  expires_at?: string;
  refresh_expires_at?: string;
  scope?: string;
  created_at?: string;
  updated_at?: string;
};

export type AdminUserDailyActivityRow = {
  team_id: string;
  credential_type: string;
  at?: string;
};

export type AdminAnalysisNodeAuditRow = {
  id: string;
  team_id?: string;
  user_id?: string;
  project_id: string;
  code_mapping_id: string;
  status: string;
  trigger: string;
  is_leaf: boolean;
  is_public: boolean;
  parent_node_id?: string;
  root_node_id: string;
  created_at?: string;
};

export type AdminCodeMappingAuditRow = {
  id: string;
  project_id: string;
  code_version_id: string;
  is_private: boolean;
  name?: string;
  parent_mapping_id?: string;
  created_at?: string;
};

export type AdminActivityAuditRow = {
  id: string;
  team_id: string;
  user_id?: string;
  project_id?: string;
  method: string;
  entity_type: string;
  related_id: string;
  created_at?: string;
};

export type AdminAuthProviderUserCount = {
  provider: string;
  user_count: number;
};

export type AdminTeamSearchRow = {
  id: string;
  name: string;
  slug: string;
  plan_status: string;
  is_default: boolean;
  deleted_at?: string;
  created_at?: string;
  created_by_user_id: string;
};

export type AdminTeamDetail = {
  id: string;
  name: string;
  slug: string;
  plan_status: string;
  is_default: boolean;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  deleted_at?: string;
  created_at?: string;
  updated_at?: string;
  created_by_user_id: string;
};

export type AdminUserCreatorSummary = {
  id: string;
  username: string;
  provider: string;
};

export type AdminTeamMemberRow = {
  membership_id: string;
  role: string;
  joined_at?: string;
  user: AdminUserMicro;
};

export type AdminTeamInviteRow = {
  id: string;
  email?: string;
  wallet_address?: string;
  role: string;
  user_id?: string;
  created_at?: string;
};

export type AdminTeamProjectRow = {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  github_repo_id: number | null;
  deleted_at?: string;
  created_at?: string;
};

export type AdminUsageEventRow = {
  id: string;
  resource: string;
  quantity: number;
  requires_metering: boolean;
  related_id?: string;
  created_at?: string;
  team_id?: string;
  user_id?: string;
};

/** Flat map resource enum → count */
export type AdminUsageEventsByResource = Record<string, number>;

export type AdminDailyCountPoint = {
  date: string;
  count: number;
};

export type AdminSignupTimeseriesPoint = {
  date: string;
  new_users: number;
};

export type AdminAnalysisStatusCount = {
  status: string;
  count: number;
};

export type AdminAnalysisTriggerCount = {
  trigger: string;
  count: number;
};

export type AdminTeamPlanCountRow = {
  plan_status: string;
  team_count: number;
};

export type AdminTeamLeaderboardRow = {
  team_id: string;
  name?: string;
  slug?: string;
  plan_status?: string;
  deleted_at?: string;
  member_count: number;
};

export type AdminOauthProviderCountRow = {
  provider: string;
  connection_count: number;
};

export type AdminUserSignupBounds = {
  earliest?: string;
  latest?: string;
};

export type AdminDistinctDailyUsers = {
  distinct_users: number;
  days: number;
};

export type AdminDailyActivityRowCount = {
  rows: number;
  days: number;
};

// --- Query param types -------------------------------------------------------

export type AdminSearchQuery = { search?: string; limit?: number };

export type AdminRecentUsersQuery = { limit?: number };

export type AdminUserDailyActivityQuery = { limit?: number };

export type AdminUserAnalysisNodesQuery = { limit?: number };

export type AdminUserCodeMappingsQuery = { limit?: number };

export type AdminUserActivitiesQuery = { limit?: number };

export type AdminUserUsageEventsQuery = { limit?: number };

export type AdminTeamAnalysisNodesQuery = { limit?: number; project_id?: string };

export type AdminTeamActivitiesQuery = { limit?: number };

export type AdminTeamUsageEventsQuery = { limit?: number };

export type AdminTimeseriesSignupsQuery = { days?: number };

export type AdminTimeseriesDaysQuery = { days?: number };

export type AdminTimeseriesScopeQuery = {
  days?: number;
  user_id?: string;
  team_id?: string;
};

export type AdminTimeseriesAnalysisNodesQuery = {
  days?: number;
  leaf_only?: boolean;
  user_id?: string;
  team_id?: string;
};

export type AdminMetricUsersCountQuery = { is_admin?: boolean | null };

export type AdminMetricSinceQuery = { since: string };

export type AdminMetricDaysWindowQuery = { days?: number };

export type AdminMetricLargestTeamsQuery = { limit?: number };
