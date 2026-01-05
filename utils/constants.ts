import { QueryKey } from "@tanstack/react-query";

export const NetworkToNameMapper = {
  eth: "ETH Mainnet",
  bsc: "Binance Smart Chain",
  polygon: "Polygon",
  base: "Base",
  eth_sepolia: "ETH Sepolia testnet",
  bsc_test: "Binance testnet",
  polygon_amoy: "Polygon testnet",
  base_sepolia: "Base Sepolia testnet",
};

// CSS custom properties for use with Tailwind
export const severityColorMap = {
  critical: "var(--color-critical)",
  high: "var(--color-high)",
  medium: "var(--color-medium)",
  low: "var(--color-low)",
};

export const QUERY_KEYS = {
  ACTIVITIES: "activities",
  ANALYSES: "analyses",
  PROJECTS: "projects",
  TEAMS: "teams",
  CODES: "codes",
  MEMBERS: "members",
  CHATS: "chats",
  USERS: "users",
  INVITES: "invites",
  API_KEYS: "api-keys",
  CUSTOMERS: "customers",
  SUBSCRIPTIONS: "subscriptions",
  PAYMENT_METHODS: "payment-methods",
  ADD_ONS: "add-ons",
  PRODUCTS: "products",
  BREADCRUMBS: "breadcrumbs",
  GITHUB_INSTALLATIONS: "github-installations",
  GITHUB_REPOSITORIES: "github-repositories",
  GITHUB_BRANCHES: "github-branches",
};

export const NETWORKS = [
  { value: "eth", label: "Ethereum" },
  { value: "bsc", label: "BSC" },
  { value: "polygon", label: "Polygon" },
  { value: "base", label: "Base" },
  { value: "avax", label: "Avalanche" },
  { value: "mode", label: "Mode" },
  { value: "arb", label: "Arbitrum" },
  { value: "eth_sepolia", label: "Ethereum Sepolia" },
  { value: "bsc_test", label: "BSC Testnet" },
  { value: "polygon_amoy", label: "Polygon Amoy" },
  { value: "base_sepolia", label: "Base Sepolia" },
  { value: "avax_fuji", label: "Avalanche Fuji" },
  { value: "mode_testnet", label: "Mode Testnet" },
  { value: "arb_sepolia", label: "Arbitrum Sepolia" },
];

export const BLOCK_EXPLORER_BASE_URLS: Record<string, string> = {
  eth: "https://etherscan.io",
  bsc: "https://bscscan.com",
  polygon: "https://polygonscan.com",
  base: "https://basescan.org",
  avax: "https://snowtrace.io",
  mode: "https://modescan.io",
  arb: "https://arbiscan.io",
  eth_sepolia: "https://sepolia.etherscan.io",
  bsc_test: "https://testnet.bscscan.com",
  polygon_amoy: "https://amoy.polygonscan.com",
  base_sepolia: "https://sepolia.basescan.org",
  avax_fuji: "https://testnet.snowtrace.io",
  mode_testnet: "https://testnet.modescan.io",
  arb_sepolia: "https://sepolia.arbiscan.io",
};

export const generateQueryKey = {
  projectActivities: (projectSlug: string): QueryKey => [
    QUERY_KEYS.ACTIVITIES,
    "project",
    projectSlug,
  ],
  teamActivities: (teamSlug: string): QueryKey => [QUERY_KEYS.ACTIVITIES, "team", teamSlug],

  team: (teamSlug: string): QueryKey => [QUERY_KEYS.TEAMS, teamSlug],
  teams: (): QueryKey => [QUERY_KEYS.TEAMS],

  allProjects: (): QueryKey => [QUERY_KEYS.PROJECTS],
  projects: (teamSlug: string, filter: { [key: string]: string | undefined }): QueryKey => [
    QUERY_KEYS.PROJECTS,
    teamSlug,
    filter,
  ],
  project: (projectSlug: string): QueryKey => [QUERY_KEYS.PROJECTS, projectSlug],
  projectRecentCode: (projectSlug: string): QueryKey => [
    QUERY_KEYS.PROJECTS,
    projectSlug,
    "recent-code",
  ],

  apiKeys: (teamSlug: string): QueryKey => [QUERY_KEYS.API_KEYS, teamSlug],
  invites: (teamSlug: string): QueryKey => [QUERY_KEYS.INVITES, teamSlug],
  userInvites: (): QueryKey => [QUERY_KEYS.INVITES, "user"],
  members: (teamSlug: string): QueryKey => [QUERY_KEYS.MEMBERS, teamSlug],

  currentUser: (): QueryKey => [QUERY_KEYS.USERS],
  currentMember: (teamSlug: string): QueryKey => [QUERY_KEYS.MEMBERS, "current", teamSlug],

  code: (codeId: string): QueryKey => [QUERY_KEYS.CODES, codeId],
  codeNodes: (
    codeId: string,
    filter?: { name?: string; source_id?: string; node_type?: string },
  ): QueryKey => [QUERY_KEYS.CODES, codeId, "nodes", filter],
  codeNode: (codeNodeId: string): QueryKey => [QUERY_KEYS.CODES, codeNodeId, "node"],
  codeRelations: (codeId: string): QueryKey => [QUERY_KEYS.CODES, codeId, "relations"],
  codeSimilarity: (codeId: string): QueryKey => [QUERY_KEYS.CODES, codeId, "similarity"],
  codeSources: (codeId: string): QueryKey => [QUERY_KEYS.CODES, codeId, "sources"],
  codeSource: (codeId: string, sourceId: string): QueryKey => [
    QUERY_KEYS.CODES,
    codeId,
    "source",
    sourceId,
  ],
  codeTree: (codeId: string): QueryKey => [QUERY_KEYS.CODES, codeId, "tree"],
  codes: (teamSlug: string, filter: { [key: string]: string | undefined }): QueryKey => [
    QUERY_KEYS.CODES,
    teamSlug,
    filter,
  ],

  chat: (chatId: string): QueryKey => [QUERY_KEYS.CHATS, chatId],
  chatMessages: (chatId: string): QueryKey => [QUERY_KEYS.CHATS, chatId, "messages"],
  chats: (teamSlug: string, filter: { [key: string]: string | undefined }): QueryKey => [
    QUERY_KEYS.CHATS,
    teamSlug,
    filter,
  ],

  analysis: (nodeId: string): QueryKey => [QUERY_KEYS.ANALYSES, nodeId],
  analysisDetailed: (nodeId: string): QueryKey => [QUERY_KEYS.ANALYSES, nodeId, "detailed"],
  analyses: (teamSlug: string, filter?: { [key: string]: string | undefined }): QueryKey => [
    QUERY_KEYS.ANALYSES,
    teamSlug,
    filter,
  ],

  analysisHead: (nodeId: string): QueryKey => [QUERY_KEYS.ANALYSES, nodeId, "head"],

  analysisLeafs: (nodeId: string): QueryKey => [QUERY_KEYS.ANALYSES, nodeId, "leafs"],
  analysisDag: (nodeId: string): QueryKey => [QUERY_KEYS.ANALYSES, nodeId, "dag"],
  analysisDraft: (nodeId: string): QueryKey => [QUERY_KEYS.ANALYSES, nodeId, "draft"],
  analysisScopes: (nodeId: string): QueryKey => [QUERY_KEYS.ANALYSES, nodeId, "scopes"],
  analysisFindings: (nodeId: string): QueryKey => [QUERY_KEYS.ANALYSES, nodeId, "findings"],

  subscription: (teamSlug: string): QueryKey => [QUERY_KEYS.SUBSCRIPTIONS, teamSlug],
  addons: (teamSlug: string): QueryKey => [QUERY_KEYS.ADD_ONS, teamSlug],
  customer: (teamSlug: string): QueryKey => [QUERY_KEYS.CUSTOMERS, teamSlug],
  paymentMethods: (teamSlug: string): QueryKey => [QUERY_KEYS.PAYMENT_METHODS, teamSlug],
  products: (teamSlug: string): QueryKey => [QUERY_KEYS.PRODUCTS, teamSlug],

  githubInstallations: (): QueryKey => [QUERY_KEYS.GITHUB_INSTALLATIONS],
  githubRepositories: (installationId: number, teamSlug?: string): QueryKey => [
    QUERY_KEYS.GITHUB_REPOSITORIES,
    installationId,
    teamSlug ?? "",
  ],
};
