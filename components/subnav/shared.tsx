"use client";

import { Subnav, SubnavItem } from "@/components/ui/subnav";
import { useParams, usePathname } from "next/navigation";
import React from "react";

const SharedSubnav: React.FC = () => {
  const { nodeId } = useParams<{
    teamSlug: string;
    projectSlug: string;
    nodeId: string;
  }>();
  const pathname = usePathname();

  const navItems = [
    {
      label: "Analysis",
      href: `/shared/${nodeId}`,
    },
    {
      label: "Source Code",
      href: `/shared/${nodeId}/code`,
    },
  ];

  const isActive = (href: string): boolean => {
    if (href === `/shared/${nodeId}`) {
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

export default SharedSubnav;
