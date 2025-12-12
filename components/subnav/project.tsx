"use client";

import { Subnav, SubnavItem } from "@/components/ui/subnav";
import { useParams, usePathname } from "next/navigation";
import React from "react";

const ProjectSubnav: React.FC = () => {
  const { teamSlug, projectSlug } = useParams<{ teamSlug: string; projectSlug: string }>();
  const pathname = usePathname();

  if (!teamSlug) return null;

  const navItems = [
    {
      label: "Overview",
      href: `/${teamSlug}/${projectSlug}`,
    },
    {
      label: "Analysis Threads",
      href: `/${teamSlug}/${projectSlug}/analysis-threads`,
    },
    {
      label: "Codes",
      href: `/${teamSlug}/${projectSlug}/codes`,
    },
    {
      label: "My Chats",
      href: `/${teamSlug}/${projectSlug}/chats`,
    },
  ];

  const isActive = (href: string): boolean => {
    if (href === `/${teamSlug}/${projectSlug}`) {
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

export default ProjectSubnav;
