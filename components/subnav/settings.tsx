"use client";

import { SubnavItem } from "@/components/ui/subnav";
import { Code, DollarSign, File, Files, Settings as SettingsIcon, User } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import React from "react";

const SettingsSubnav: React.FC = () => {
  const { teamSlug } = useParams<{ teamSlug: string }>();
  const pathname = usePathname();

  if (!teamSlug) return null;

  const navItems = [
    {
      label: "General",
      href: `/team/${teamSlug}/settings`,
      icon: SettingsIcon,
    },
    {
      label: "API",
      href: `/team/${teamSlug}/settings/api`,
      icon: Code,
    },
    {
      label: "Billing",
      href: `/team/${teamSlug}/settings/billing`,
      icon: DollarSign,
    },
    {
      label: "Invoices",
      href: `/team/${teamSlug}/settings/invoices`,
      icon: File,
    },
    {
      label: "Plans",
      href: `/team/${teamSlug}/settings/plans`,
      icon: Files,
    },
    {
      label: "Members",
      href: `/team/${teamSlug}/settings/members`,
      icon: User,
    },
  ];

  const isActive = (href: string): boolean => {
    if (href === `/team/${teamSlug}/settings`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="w-48 space-y-1">
      {navItems.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <SubnavItem
            key={item.href}
            href={item.href}
            isActive={active}
            className="flex items-center gap-2"
          >
            <Icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </SubnavItem>
        );
      })}
    </nav>
  );
};

export default SettingsSubnav;
