"use client";

import { navigation } from "@/utils/navigation";
import { HrefProps } from "@/utils/types";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useMemo } from "react";

type NavItemProp = {
  name: string;
  href: (data: HrefProps) => string;
  isActive?: (data: HrefProps, pathname: string) => boolean;
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
    name: "Projects",
    href: navigation.team.projects,
  },
  {
    name: "Audits",
    href: navigation.team.audits,
  },
  {
    name: "Versions",
    href: navigation.team.versions,
  },
  {
    name: "Analytics",
    href: navigation.team.analytics,
  },
  {
    name: "Settings",
    href: navigation.team.settings.overview,
    isActive: (data, pathname) => pathname.startsWith(navigation.team.settings.overview(data)),
  },
];

const navigationItemsProject: NavItemProp[] = [
  {
    name: "Overview",
    href: navigation.project.overview,
  },
  {
    name: "Audits",
    href: navigation.project.audits,
  },
  {
    name: "Versions",
    href: navigation.project.versions.overview,
  },
  {
    name: "Analytics",
    href: navigation.project.analytics,
  },
  {
    name: "Settings",
    href: navigation.project.settings,
  },
];

const navigationItemsVersion: NavItemProp[] = [
  {
    name: "Overview",
    href: navigation.version.overview,
  },
  {
    name: "Audits",
    href: navigation.version.audits.overview,
  },
  {
    name: "Code",
    href: navigation.version.sources,
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

const navigationItemsShared: NavItemProp[] = [
  {
    name: "Overview",
    href: navigation.shared.overview,
  },
  {
    name: "Scope",
    href: navigation.shared.scope,
  },
  {
    name: "Overlay",
    href: navigation.shared.overlay,
  },
];

const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const params = useParams<HrefProps>();
  const navigationItemsFiltered = useMemo(() => {
    let items: NavItemProp[] = [];
    if (pathname.startsWith("/user")) {
      items = navigationItemsUser;
    } else if (pathname.startsWith("/shared")) {
      items = navigationItemsShared;
    } else if (params.auditId) {
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
      isActive: item.isActive ? item.isActive(params, pathname) : pathname === item.href(params),
    }));
  }, [params, pathname]);

  return (
    <div className="require-remaining-height flex flex-col">
      <div
        id="nav-items"
        className="w-full px-4 flex items-center border-b border-neutral-800 h-9 overflow-auto overflow-y-hidden"
      >
        {navigationItemsFiltered.map((item) => (
          <Link key={item.name} href={item.href} data-active={item.isActive} className="nav-item">
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
      <div className="px-10 py-6 grow">{children}</div>
    </div>
  );
};

export default Container;
