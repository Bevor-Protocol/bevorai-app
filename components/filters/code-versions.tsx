"use client";

import { teamActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SearchInput } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateQueryKey } from "@/utils/constants";
import { DefaultCodesQuery } from "@/utils/query-params";
import { useQuery } from "@tanstack/react-query";
import React from "react";

const SOURCE_TYPES = [
  { value: "scan", label: "Scan" },
  { value: "paste", label: "Paste" },
  { value: "upload_file", label: "Upload File" },
  { value: "upload_folder", label: "Upload Folder" },
  { value: "repository", label: "Repository" },
];

const NETWORKS = [
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

export const CodeVersionFilters: React.FC<{
  teamSlug: string;
  filters: typeof DefaultCodesQuery;
  setFilters: React.Dispatch<React.SetStateAction<typeof DefaultCodesQuery>>;
  isAnySearched: boolean;
  handleClear: () => void;
}> = ({ teamSlug, filters, handleClear, setFilters, isAnySearched }) => {
  const { data: members } = useQuery({
    queryKey: generateQueryKey.members(teamSlug),
    queryFn: () => teamActions.getMembers(teamSlug),
  });

  return (
    <div className="flex items-center justify-start mb-6 gap-4 flex-wrap">
      <SearchInput
        type="text"
        placeholder="Search code versions..."
        value={filters.identifier || ""}
        onChange={(e) => setFilters((prev) => ({ ...prev, identifier: e.target.value }))}
        className="min-w-60"
      />
      <Select
        value={filters.user_id}
        onValueChange={(value) => setFilters((prev) => ({ ...prev, user_id: value }))}
        key={`user-${filters.user_id || "empty"}`}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="User" />
        </SelectTrigger>
        <SelectContent>
          {members?.map((member) => (
            <SelectItem key={member.user.id} value={member.user.id}>
              <Icon size="sm" seed={member.user.id} />
              {member.user.username}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.method}
        onValueChange={(value) => setFilters((prev) => ({ ...prev, method: value }))}
        key={`method-${filters.method || "empty"}`}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Source Type" />
        </SelectTrigger>
        <SelectContent>
          {SOURCE_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.network}
        onValueChange={(value) => setFilters((prev) => ({ ...prev, network: value }))}
        key={`network-${filters.network || "empty"}`}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Network" />
        </SelectTrigger>
        <SelectContent>
          {NETWORKS.map((network) => (
            <SelectItem key={network.value} value={network.value}>
              {network.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.order || "desc"}
        onValueChange={(value) => setFilters((prev) => ({ ...prev, order: value }))}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desc">Descending</SelectItem>
          <SelectItem value="asc">Ascending</SelectItem>
        </SelectContent>
      </Select>
      {isAnySearched && (
        <Button variant="ghost" size="sm" onClick={handleClear}>
          Clear All
        </Button>
      )}
    </div>
  );
};
