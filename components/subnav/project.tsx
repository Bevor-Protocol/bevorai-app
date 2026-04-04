"use client";

import { Subnav, SubnavItem } from "@/components/ui/subnav";
import { useParams, usePathname } from "next/navigation";
import React from "react";

const ProjectSubnav: React.FC = () => {
  const { teamSlug, projectSlug } = useParams<{ teamSlug: string; projectSlug: string }>();
  const pathname = usePathname();

  const navItems = [
    {
      label: "Overview",
      href: `/team/${teamSlug}/${projectSlug}`,
    },
    {
      label: "Board",
      href: `/team/${teamSlug}/${projectSlug}/kanban`,
      activePrefix: `/team/${teamSlug}/${projectSlug}/kanban`,
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
        <SubnavItem key={item.label} isActive={isActive(item)} href={item.href} shouldHighlight>
          {item.label}
        </SubnavItem>
      ))}
    </Subnav>
  );
};

export default ProjectSubnav;
