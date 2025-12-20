"use client";

import { Subnav, SubnavItem } from "@/components/ui/subnav";
import { useParams, usePathname } from "next/navigation";
import React from "react";

const ChatSubnav: React.FC = () => {
  const { teamSlug, projectSlug, chatId } = useParams<{
    teamSlug: string;
    projectSlug: string;
    chatId: string;
  }>();
  const pathname = usePathname();

  if (!teamSlug) return null;

  const navItems = [
    {
      label: "Chat",
      href: `/team/${teamSlug}/${projectSlug}/chats/${chatId}`,
    },
    {
      label: "Source Code",
      href: `/team/${teamSlug}/${projectSlug}/chats/${chatId}/code`,
    },
    {
      label: "Analysis",
      href: `/team/${teamSlug}/${projectSlug}/chats/${chatId}/analysis`,
    },
  ];

  const isActive = (href: string): boolean => {
    if (href === `/team/${teamSlug}/${projectSlug}/chats/${chatId}`) {
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

export default ChatSubnav;
