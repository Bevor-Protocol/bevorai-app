import { BLOCK_EXPLORER_BASE_URLS } from "@/utils/constants";
import { CodeMappingSchemaI, DropdownOption } from "@/utils/types";
import { Address } from "viem";

export const trimAddress = (address: Address | string | undefined): string => {
  return address?.substring(0, 6) + "..." + address?.substring(address.length - 3, address.length);
};

export const constructSearchQuery = ({
  networks,
  address,
  contract,
  page,
}: {
  networks: DropdownOption[];
  address: string;
  contract: string;
  page?: string;
}): URLSearchParams => {
  const search = new URLSearchParams();
  if (networks.length) {
    const params = networks.map((network) => network.value);
    search.append("network", params.join(","));
  }
  if (address) {
    search.append("user_address", address);
  }
  if (contract) {
    search.append("contract_address", contract);
  }
  if (page) {
    search.append("page", page);
  }

  return search;
};

export const truncateId = (id: string, length: number = 9): string => {
  return id.slice(0, length);
};

export const timeSince = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatDateLong = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const formatNumber = (n: number): string => {
  if (n < 100) {
    return n.toString();
  }
  if (n <= 1000) {
    return "100+";
  }
  return "1,000+";
};

export const truncateVersion = (s: string): string => {
  return s.slice(0, 5) + "..." + s.slice(-5);
};

export const explorerUrl = (network: string, address: string): string => {
  const explorer = BLOCK_EXPLORER_BASE_URLS[network];
  return explorer + "/address/" + address;
};

export const commitUrl = (version: CodeMappingSchemaI): string => {
  const org = version.repository?.account.login;
  const repo = version.repository?.name;
  const sha = version.commit?.sha;
  return `https://github.com/${org}/${repo}/commit/${sha}`;
};
