"use client";

import { analysisActions } from "@/actions/bevor";
import { Subnav, SubnavItem } from "@/components/ui/subnav";
import { generateQueryKey } from "@/utils/constants";
import { useQuery } from "@tanstack/react-query";
import { useParams, usePathname } from "next/navigation";
import React from "react";

const ProjectSubnav: React.FC = () => {
  const { teamSlug, projectSlug } = useParams<{ teamSlug: string; projectSlug: string }>();
  const pathname = usePathname();

  const query = { page_size: "1", project_slug: projectSlug };
  const { data: analyses } = useQuery({
    queryKey: generateQueryKey.analyses(teamSlug, query),
    queryFn: async () =>
      analysisActions.getAnalyses(teamSlug, query).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: !!teamSlug && !!projectSlug,
  });

  if (!teamSlug) return null;

  const latestAnalysisId = analyses?.results[0]?.id;
  const analysisHref = latestAnalysisId
    ? `/team/${teamSlug}/${projectSlug}/analyses/${latestAnalysisId}`
    : `/team/${teamSlug}/${projectSlug}/analyses`;

  const navItems = [
    {
      label: "Overview",
      href: `/team/${teamSlug}/${projectSlug}`,
    },
    {
      label: "Analysis",
      href: analysisHref,
      activePrefix: `/team/${teamSlug}/${projectSlug}/analyses`,
    },
    {
      label: "My Chats",
      href: `/team/${teamSlug}/${projectSlug}/chats`,
    },
  ];

  const isActive = (item: (typeof navItems)[number]): boolean => {
    const prefix = "activePrefix" in item ? item.activePrefix : item.href;
    if (prefix === `/team/${teamSlug}/${projectSlug}`) {
      return pathname === prefix;
    }
    return pathname.startsWith(prefix!);
  };

  return (
    <Subnav className="sticky top-0 bg-background z-10">
      {navItems.map((item) => (
        <SubnavItem
          key={item.label}
          isActive={isActive(item)}
          href={item.href}
          shouldHighlight
        >
          {item.label}
        </SubnavItem>
      ))}
    </Subnav>
  );
};

export default ProjectSubnav;
