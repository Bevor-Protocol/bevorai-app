"use client";

import { Subnav, SubnavItem } from "@/components/ui/subnav";
import { useParams, usePathname } from "next/navigation";
import React from "react";

const AnalysisSubnav: React.FC = () => {
  const { teamSlug, projectSlug, nodeId } = useParams<{
    teamSlug: string;
    projectSlug: string;
    nodeId: string;
  }>();
  const pathname = usePathname();

  if (!teamSlug) return null;

  const navItems = [
    {
      label: "Analysis",
      href: `/${teamSlug}/${projectSlug}/analyses/${nodeId}`,
    },
    {
      label: "Nodes",
      href: `/${teamSlug}/${projectSlug}/analyses/${nodeId}`,
    },
  ];

  const isActive = (href: string): boolean => {
    if (href === `/${teamSlug}/${projectSlug}/analyses/${nodeId}`) {
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

export default AnalysisSubnav;
