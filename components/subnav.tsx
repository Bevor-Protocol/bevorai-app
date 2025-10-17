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
    name: "Chats",
    href: navigation.team.chats,
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
    name: "Chats",
    href: navigation.project.chats,
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

const SubNav: React.FC = () => {
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
    <div className="flex flex-col h-subheader">
      <div
        id="nav-items"
        className="w-full px-4 flex items-center border-b border-border h-9 overflow-auto overflow-y-hidden"
      >
        {navigationItemsFiltered.map((item) => (
          <Link key={item.name} href={item.href} data-active={item.isActive} className="nav-item">
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SubNav;
