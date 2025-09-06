"use client";

import { bevorAction } from "@/actions";
import { AuditElement, AuditElementLoader } from "@/components/audits/element";
import { AuditEmpty } from "@/components/audits/empty";
import { useQuery } from "@tanstack/react-query";
import React from "react";

export const AuditGrid: React.FC<{ query: Record<string, string>; teamSlug: string }> = ({
  query,
  teamSlug,
}) => {
  const { data: audits, isLoading } = useQuery({
    queryKey: ["audits", query],
    queryFn: () => bevorAction.getAudits(query),
  });

  if (!audits || isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <AuditElementLoader key={index} />
        ))}
      </div>
    );
  }

  if (audits.results.length === 0) {
    return <AuditEmpty centered />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {audits.results.map((audit) => (
        <AuditElement key={audit.id} audit={audit} teamSlug={teamSlug} />
      ))}
    </div>
  );
};
