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
      href: `/team/${teamSlug}`,
    },
    {
      label: "Codes",
      href: `/team/${teamSlug}/codes`,
    },
    {
      label: "Analyses",
      href: `/team/${teamSlug}/analyses`,
    },
    {
      label: "Settings",
      href: `/team/${teamSlug}/settings`,
    },
  ];

  const isActive = (href: string): boolean => {
    if (href === `/team/${teamSlug}`) {
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
