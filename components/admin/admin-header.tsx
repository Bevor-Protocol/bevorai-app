"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  {
    href: "/admin/users",
    label: "Users",
    match: (path: string): boolean => path.startsWith("/admin/users"),
  },
  {
    href: "/admin/teams",
    label: "Teams",
    match: (path: string): boolean => path.startsWith("/admin/teams"),
  },
] as const;

export const AdminHeader: React.FC = () => {
  const pathname = usePathname();
  const onDashboard = pathname === "/admin";

  const tabClass = (active: boolean): string =>
    cn(
      "flex h-full items-center border-b-2 -mb-px text-sm transition-colors",
      active
        ? "border-primary font-medium text-foreground"
        : "border-transparent text-foreground/80 hover:text-foreground",
    );

  return (
    <nav className="flex h-header w-full items-stretch justify-between border-b border-border bg-background px-6">
      <div className="flex h-full items-stretch gap-8">
        <Link href="/admin" className={cn(tabClass(onDashboard), "font-semibold tracking-tight")}>
          Admin
        </Link>
        <div className="flex h-full items-stretch gap-6">
          {SECTIONS.map(
            ({ href, label, match }): React.ReactElement => (
              <Link key={href} href={href} className={tabClass(match(pathname))}>
                {label}
              </Link>
            ),
          )}
        </div>
      </div>
      <div className="flex items-center">
        <Link
          href="/"
          className="text-sm text-foreground/80 transition-colors hover:text-foreground"
        >
          Back to app
        </Link>
      </div>
    </nav>
  );
};
