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
      href: `/team/${teamSlug}/${projectSlug}`,
    },
    {
      label: "Codes",
      href: `/team/${teamSlug}/${projectSlug}/codes`,
    },
    {
      label: "Analyses",
      href: `/team/${teamSlug}/${projectSlug}/analyses`,
    },
    {
      label: "My Chats",
      href: `/team/${teamSlug}/${projectSlug}/chats`,
    },
  ];

  const isActive = (href: string): boolean => {
    if (href === `/team/${teamSlug}/${projectSlug}`) {
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
