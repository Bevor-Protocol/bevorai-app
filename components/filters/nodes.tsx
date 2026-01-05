"use client";

import { teamActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { DefaultAnalysisNodesQuery } from "@/utils/query-params";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import React, { useEffect, useState } from "react";

const triggerItems = ["manual_run", "chat", "manual_edit", "fork", "merge"];

const FilterContent: React.FC<{
  teamSlug: string;
  filters: typeof DefaultAnalysisNodesQuery;
  setFilters: React.Dispatch<React.SetStateAction<typeof DefaultAnalysisNodesQuery>>;
  includeProject: boolean;
  variant?: "mobile" | "desktop";
}> = ({ teamSlug, filters, setFilters, variant = "mobile" }) => {
  const isMobile = variant === "mobile";
  const selectWidth = isMobile ? "w-full" : "w-[180px]";
  const containerClass = isMobile
    ? "flex flex-col gap-4"
    : "hidden md:flex items-center justify-start gap-2 md:gap-4 flex-wrap";

  const [rootType, setRootType] = useState<"root" | "leaf" | "any">(
    filters.is_leaf ? "leaf" : filters.is_root ? "root" : "any",
  );

  const { data: members } = useQuery({
    queryKey: generateQueryKey.members(teamSlug),
    queryFn: () =>
      teamActions.getMembers(teamSlug).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const handleNodeRoot = (leafOrRoot: "root" | "leaf" | "any"): void => {
    setRootType(leafOrRoot);
    if (leafOrRoot === "root") {
      setFilters((prev) => ({ ...prev, is_root: "true", is_leaf: "" }));
    } else if (leafOrRoot === "leaf") {
      setFilters((prev) => ({ ...prev, is_leaf: "true", is_root: "" }));
    } else {
      setFilters((prev) => ({ ...prev, is_leaf: "", is_root: "" }));
    }
  };

  useEffect(() => {
    if (filters.is_leaf) {
      setRootType("leaf");
    } else if (filters.is_root) {
      setRootType("root");
    } else {
      setRootType("any");
    }
  }, [filters.is_leaf, filters.is_root]);

  return (
    <div className={containerClass}>
      <div className="relative">
        <Select
          value={filters.user_id}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, user_id: value }))}
          key={`user-${filters.user_id || "empty"}`}
        >
          <SelectTrigger className={cn(selectWidth, filters.user_id && "pr-7")}>
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
        {filters.user_id && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setFilters((prev) => ({ ...prev, user_id: "" }));
            }}
          >
            <X className="size-3" />
          </Button>
        )}
      </div>
      <Select
        value={filters.trigger}
        onValueChange={(value) => setFilters((prev) => ({ ...prev, trigger: value }))}
        key={`user-${filters.trigger || "empty"}`}
      >
        <SelectTrigger className={cn(selectWidth)}>
          <SelectValue placeholder="Trigger" />
        </SelectTrigger>
        <SelectContent>
          {triggerItems?.map((trigger) => (
            <SelectItem key={trigger} value={trigger}>
              {trigger.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={rootType}
        onValueChange={(value) => handleNodeRoot(value as "root" | "leaf" | "any")}
        key={`user-${rootType || "empty"}`}
      >
        <SelectTrigger className={cn(selectWidth)}>
          <SelectValue placeholder="Node Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="root">Root</SelectItem>
          <SelectItem value="leaf">Leaf</SelectItem>
          <SelectItem value="any">Any</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.order || "desc"}
        onValueChange={(value) => setFilters((prev) => ({ ...prev, order: value }))}
      >
        <SelectTrigger className={selectWidth}>
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desc">Descending</SelectItem>
          <SelectItem value="asc">Ascending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export const AnalysisNodeFilters: React.FC<{
  teamSlug: string;
  filters: typeof DefaultAnalysisNodesQuery;
  setFilters: React.Dispatch<React.SetStateAction<typeof DefaultAnalysisNodesQuery>>;
  isAnySearched: boolean;
  handleClear: () => void;
  includeProject: boolean;
}> = ({ teamSlug, filters, handleClear, setFilters, isAnySearched, includeProject }) => {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="py-4 sticky top-subheader z-10 bg-background">
      <div className="flex items-center justify-start flex-wrap gap-2 md:gap-4">
        {isMobile ? (
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <div className="relative shrink-0 overflow-visible">
                <Button variant="ghost" size="sm" className="relative">
                  <SlidersHorizontal className="size-4" />
                  {isAnySearched && (
                    <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
                  )}
                </Button>
              </div>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <div className="flex flex-col h-full">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="flex-1 px-4 pb-4 overflow-y-auto">
                  <FilterContent
                    teamSlug={teamSlug}
                    filters={filters}
                    setFilters={setFilters}
                    includeProject={includeProject}
                  />
                  {isAnySearched && (
                    <Button
                      variant="outline"
                      className="w-full mt-6"
                      onClick={() => {
                        handleClear();
                        setSheetOpen(false);
                      }}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <>
            <FilterContent
              teamSlug={teamSlug}
              filters={filters}
              setFilters={setFilters}
              includeProject={includeProject}
              variant="desktop"
            />
            {isAnySearched && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="shrink-0">
                Clear All
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
