"use client";

import { Subnav, SubnavItem } from "@/components/ui/subnav";
import { useParams, usePathname } from "next/navigation";
import React from "react";

const CodeVersionSubnav: React.FC = () => {
  const { teamSlug, projectSlug, codeId } = useParams<{
    teamSlug: string;
    projectSlug: string;
    codeId: string;
  }>();
  const pathname = usePathname();

  if (!teamSlug) return null;

  const navItems = [
    {
      label: "Code Version",
      href: `/${teamSlug}/${projectSlug}/codes/${codeId}`,
    },
    {
      label: "Analyses",
      href: `/${teamSlug}/${projectSlug}/codes/${codeId}/analyses`,
    },
    {
      label: "Chat",
      href: `/${teamSlug}/${projectSlug}/codes/${codeId}/chat`,
    },
  ];

  const isActive = (href: string): boolean => {
    if (href === `/${teamSlug}/${projectSlug}/codes/${codeId}`) {
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

export default CodeVersionSubnav;
