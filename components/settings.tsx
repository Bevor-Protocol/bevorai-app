/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useMemo } from "react";

type NavItemProp = {
  name: string;
  href: ({ teamSlug, projectSlug }: { teamSlug: string; projectSlug?: string }) => string;
  include: ({ teamSlug, projectSlug }: { teamSlug: string; projectSlug?: string }) => boolean;
};

const navigationItems: NavItemProp[] = [
  {
    name: "Overview",
    href: ({ teamSlug, projectSlug }) =>
      projectSlug ? `/teams/${teamSlug}/projects/settings` : `/teams/${teamSlug}/settings`,
    include: ({ teamSlug, projectSlug }) => true,
  },
  {
    name: "Billing",
    href: ({ teamSlug, projectSlug }) => `/teams/${teamSlug}/settings/billing`,
    include: ({ teamSlug, projectSlug }) => !projectSlug,
  },
  {
    name: "Invoices",
    href: ({ teamSlug, projectSlug }) => `/teams/${teamSlug}/settings/invoices`,
    include: ({ teamSlug, projectSlug }) => !projectSlug,
  },
  {
    name: "API",
    href: ({ teamSlug, projectSlug }) => `/teams/${teamSlug}/settings/api`,
    include: ({ teamSlug, projectSlug }) => !projectSlug,
  },
  {
    name: "Members",
    href: ({ teamSlug, projectSlug }) => `/teams/${teamSlug}/settings/members`,
    include: ({ teamSlug, projectSlug }) => !projectSlug,
  },
];

const SettingsSidebar: React.FC = () => {
  const pathname = usePathname();
  const { teamSlug, projectSlug } = useParams<{ teamSlug: string; projectSlug?: string }>();
  const navigationItemsFiltered = useMemo(() => {
    return navigationItems
      .filter((item) => item.include({ teamSlug, projectSlug }))
      .map((item) => {
        return {
          name: item.name,
          href: item.href({ teamSlug, projectSlug }),
        };
      });
  }, [teamSlug, projectSlug]);

  return (
    <div className="flex flex-col gap-4 min-w-28">
      {navigationItemsFiltered.map((item, i) => (
        <Link
          key={i}
          href={item.href}
          className={cn(
            "text-base hover:bg-neutral-800 px-2 py-1 rounded",
            pathname === item.href ? "text-white" : "text-neutral-400",
          )}
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
};

export default SettingsSidebar;
