/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useMemo } from "react";

type NavItemProp = {
  name: string;
  href: ({ teamId, projectId }: { teamId: string; projectId?: string }) => string;
  include: ({ teamId, projectId }: { teamId: string; projectId?: string }) => boolean;
};

const navigationItems: NavItemProp[] = [
  {
    name: "Overview",
    href: ({ teamId, projectId }) =>
      projectId ? `/teams/${teamId}/projects/settings` : `/teams/${teamId}/settings`,
    include: ({ teamId, projectId }) => true,
  },
  {
    name: "Billing",
    href: ({ teamId, projectId }) => `/teams/${teamId}/settings/billing`,
    include: ({ teamId, projectId }) => !projectId,
  },
  {
    name: "Plans",
    href: ({ teamId, projectId }) => `/teams/${teamId}/settings/plans`,
    include: ({ teamId, projectId }) => !projectId,
  },
  {
    name: "Invoices",
    href: ({ teamId, projectId }) => `/teams/${teamId}/settings/invoices`,
    include: ({ teamId, projectId }) => !projectId,
  },
  {
    name: "API",
    href: ({ teamId, projectId }) => `/teams/${teamId}/settings/api`,
    include: ({ teamId, projectId }) => !projectId,
  },
  {
    name: "Members",
    href: ({ teamId, projectId }) => `/teams/${teamId}/settings/members`,
    include: ({ teamId, projectId }) => !projectId,
  },
];

const SettingsSidebar: React.FC = () => {
  const pathname = usePathname();
  const { teamId, projectId } = useParams<{ teamId: string; projectId?: string }>();
  const navigationItemsFiltered = useMemo(() => {
    return navigationItems
      .filter((item) => item.include({ teamId, projectId }))
      .map((item) => {
        return {
          name: item.name,
          href: item.href({ teamId, projectId }),
        };
      });
  }, [teamId, projectId]);

  return (
    <div className="flex flex-col gap-4 min-w-28">
      {navigationItemsFiltered.map((item, i) => (
        <Link
          key={i}
          href={item.href}
          className={cn(
            "text-base hover:bg-neutral-800 px-2 py-1 rounded",
            pathname === item.href ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
};

export default SettingsSidebar;
