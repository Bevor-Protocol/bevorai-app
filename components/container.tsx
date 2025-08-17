"use client";

import { navigation } from "@/utils/navigation";
import { HrefProps } from "@/utils/types";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useMemo } from "react";

type NavItemProp = {
  name: string;
  href: (data: HrefProps) => string;
};

const navigationItemsUser: NavItemProp[] = [
  {
    name: "Overview",
    href: navigation.user.overview,
  },
  {
    name: "Settings",
    href: navigation.user.settings,
  },
];

const navigationItemsTeam: NavItemProp[] = [
  {
    name: "Overview",
    href: navigation.team.overview,
  },
  {
    name: "Settings",
    href: navigation.team.settings.overview,
  },
  {
    name: "Audits",
    href: navigation.team.audits,
  },
  {
    name: "Analytics",
    href: navigation.team.analytics,
  },
];

const navigationItemsProject: NavItemProp[] = [
  {
    name: "Overview",
    href: navigation.project.overview,
  },
  {
    name: "Settings",
    href: navigation.project.settings,
  },
  {
    name: "Audits",
    href: navigation.project.audits,
  },
  {
    name: "Analytics",
    href: navigation.project.analytics,
  },
];

const navigationItemsVersion: NavItemProp[] = [
  {
    name: "Overview",
    href: navigation.version.overview,
  },
  {
    name: "Code",
    href: navigation.version.sources,
  },
  {
    name: "Audits",
    href: navigation.version.audits.overview,
  },
  {
    name: "Analytics",
    href: navigation.version.analytics,
  },
];

const navigationItemsAudit: NavItemProp[] = [
  {
    name: "Overview",
    href: navigation.audit.overview,
  },
  {
    name: "Scope",
    href: navigation.audit.scope,
  },
  {
    name: "Overlay",
    href: navigation.audit.overlay,
  },
];

const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const params = useParams<HrefProps>();
  const navigationItemsFiltered = useMemo(() => {
    let items = navigationItemsUser;
    if (params.auditId) {
      items = navigationItemsAudit;
    } else if (params.versionId) {
      items = navigationItemsVersion;
    } else if (params.projectSlug) {
      items = navigationItemsProject;
    } else if (params.teamSlug) {
      items = navigationItemsTeam;
    }
    return items.map((item) => ({
      name: item.name,
      href: item.href(params),
      isActive: pathname === item.href(params),
    }));
  }, [params, pathname]);
  return (
    <div className="bg-neutral-950 require-remaining-height">
      <div id="nav-items" className="w-full px-4 flex items-center border-b border-neutral-800 h-9">
        {navigationItemsFiltered.map((item) => (
          <Link key={item.name} href={item.href} data-active={item.isActive} className="nav-item">
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
      <div className="px-4">{children}</div>
    </div>
  );
};

export default Container;
