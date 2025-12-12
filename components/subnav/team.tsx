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
      href: `/${teamSlug}`,
    },
    {
      label: "Analysis Threads",
      href: `/${teamSlug}/analysis-threads`,
    },
    {
      label: "Codes",
      href: `/${teamSlug}/codes`,
    },
    {
      label: "Settings",
      href: `/${teamSlug}/settings`,
    },
  ];

  const isActive = (href: string): boolean => {
    if (href === `/${teamSlug}`) {
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
