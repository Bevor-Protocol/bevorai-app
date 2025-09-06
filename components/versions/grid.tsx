"use client";

import { bevorAction } from "@/actions";
import { CodeVersionElement, CodeVersionElementLoader } from "@/components/versions/element";
import { VersionEmpty } from "@/components/versions/empty";
import { useQuery } from "@tanstack/react-query";
import React from "react";

export const VersionGrid: React.FC<{ teamSlug: string; query: Record<string, string> }> = ({
  teamSlug,
  query,
}) => {
  const { data: versions, isLoading } = useQuery({
    queryKey: ["versions", query],
    queryFn: () => bevorAction.getVersions(query),
  });

  if (!versions || isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <CodeVersionElementLoader key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {versions.results.map((version, ind) => (
        <CodeVersionElement key={version.id + String(ind)} version={version} teamSlug={teamSlug} />
      ))}
      {versions.results.length === 0 && <VersionEmpty centered />}
    </div>
  );
};
