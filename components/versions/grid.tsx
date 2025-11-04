"use client";

import { versionActions } from "@/actions/bevor";
import { CodeVersionElement, CodeVersionElementLoader } from "@/components/versions/element";
import { VersionEmpty } from "@/components/versions/empty";
import { useSuspenseQuery } from "@tanstack/react-query";
import React from "react";

export const VersionGrid: React.FC<{ teamId: string; query: Record<string, string> }> = ({
  teamId,
  query,
}) => {
  const { data: versions } = useSuspenseQuery({
    queryKey: ["versions", query],
    queryFn: () => versionActions.getVersions(teamId, query),
  });

  if (!versions) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <CodeVersionElementLoader key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {versions.results.map((version, ind) => (
        <CodeVersionElement key={version.id + String(ind)} version={version} teamId={teamId} />
      ))}
      {versions.results.length === 0 && <VersionEmpty centered />}
    </div>
  );
};
