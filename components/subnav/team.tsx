"use client";

import { Subnav, SubnavItem } from "@/components/ui/subnav";
import { useParams, usePathname } from "next/navigation";
import React from "react";

const TeamSubnav: React.FC = () => {
  const { teamSlug } = useParams<{ teamSlug: string }>();
  const pathname = usePathname();

  if (!teamSlug) return null;

  const navItems = [
    {
      label: "Projects",
      href: `/teams/${teamSlug}`,
    },
    {
      label: "Analysis Threads",
      href: `/teams/${teamSlug}/analysis-threads`,
    },
    {
      label: "Settings",
      href: `/teams/${teamSlug}/settings`,
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

export default TeamSubnav;
