"use client";

import { Subnav, SubnavItem } from "@/components/ui/subnav";
import { useParams, usePathname } from "next/navigation";
import React from "react";

const AnalysisThreadSubnav: React.FC = () => {
  const { teamSlug, projectSlug, analysisId } = useParams<{
    teamSlug: string;
    projectSlug: string;
    analysisId: string;
  }>();
  const pathname = usePathname();

  if (!teamSlug) return null;

  const navItems = [
    {
      label: "Analysis Thread",
      href: `/teams/${teamSlug}/projects/${projectSlug}/analysis-threads/${analysisId}`,
    },
    {
      label: "Chat",
      href: `/teams/${teamSlug}/projects/${projectSlug}/analysis-threads/${analysisId}/chat`,
    },
  ];

  const isActive = (href: string): boolean => {
    if (href === `/teams/${teamSlug}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <Subnav className="sticky top-0 bg-background z-10">
      {navItems.map((item) => (
        <SubnavItem
          key={item.label}
          isActive={isActive(item.href)}
          href={item.href}
          shouldHighlight
        >
          {item.label}
        </SubnavItem>
      ))}
    </Subnav>
  );
};

export default AnalysisThreadSubnav;
