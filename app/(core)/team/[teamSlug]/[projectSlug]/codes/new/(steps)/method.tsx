import { Badge } from "@/components/ui/badge";
import { GridPattern } from "@/components/ui/grid-pattern";
import { cn } from "@/lib/utils";
import {
  Code,
  Folder,
  GitBranch,
  GitCommitHorizontal,
  Globe,
  LucideProps,
  Upload,
} from "lucide-react";
import Link from "next/link";
import React, { ForwardRefExoticComponent, RefAttributes } from "react";

type VersionProps = {
  Icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  iconColor: string;
  title: string;
  description: string;
  route?: (teamSlug: string) => string;
  method?: string;
  badge?: string;
};

const versionMethods: VersionProps[] = [
  {
    Icon: Upload,
    iconColor: "text-blue-400",
    title: "Upload / Write File",
    description: "Upload your .sol file(s) for analysis, or manually write/paste it",
    method: "file",
  },
  {
    Icon: Folder,
    iconColor: "text-yellow-400",
    title: "Upload Folder",
    description: "Upload an entire folder of solidity files",
    method: "folder",
  },
  {
    Icon: Globe,
    iconColor: "text-purple-400",
    title: "Explorer Scan",
    description: "Enter a deployed, verified contract address to analyze",
    method: "scan",
  },
  {
    Icon: GitCommitHorizontal,
    iconColor: "text-foreground-400",
    title: "Public Repository Scan",
    description: "Scan one-off public repositories",
    method: "repo",
  },
  {
    Icon: Code,
    iconColor: "text-orange-400",
    title: "MCP / IDE Integration",
    description: "Integrate directly with your IDE for seamless development. Requires an API key",
    route: (teamSlug: string) => `/team/${teamSlug}/settings/api`,
    badge: "get API key",
  },
  {
    Icon: GitBranch,
    iconColor: "text-foreground-400",
    title: "Github Connection",
    description:
      "Automatically scan and analyze your Git repositories. These connections will be scoped to their own project.",
    route: (teamSlug: string) => `/user/github/manage?teamSlug=${teamSlug}`,
    badge: "create connection",
  },
];

const MethodCardWrapper: React.FC<{
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ href, onClick, children, className }) => {
  const baseClassName = cn(
    "relative overflow-hidden p-6 last:border-r last:border-b group cursor-pointer",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={baseClassName}>
        {children}
      </Link>
    );
  }

  return (
    <div className={baseClassName} onClick={onClick}>
      {children}
    </div>
  );
};

const MethodSelection: React.FC<{
  setMethod: (method: string) => void;
  nextStep: () => void;
  teamSlug: string;
  isChild: boolean;
}> = ({ setMethod, nextStep, teamSlug, isChild }) => {
  const handleSelection = (method: VersionProps): void => {
    if (!method.method) return;
    setMethod(method.method);
    nextStep();
  };

  return (
    <div className="max-w-5xl m-auto">
      <div className="py-10">
        <h2>Select how you would like to upload a code version</h2>
        {isChild && (
          <p className="text-muted-foreground my-6">
            This code will be referenced as a child of the code version you selected
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-y border-t border-l">
        {versionMethods.map((method, ind) => (
          <MethodCardWrapper
            key={ind}
            href={method.route ? method.route(teamSlug) : undefined}
            onClick={method.route ? undefined : (): void => handleSelection(method)}
          >
            <div className="-mt-2 -ml-20 pointer-events-none absolute top-0 left-1/2 size-full mask-[radial-gradient(farthest-side_at_top,white,transparent)]">
              <GridPattern
                className="absolute inset-0 size-full stroke-foreground/20 group-hover:stroke-foreground/50 transition-colors"
                height={40}
                width={40}
                x={5}
              />
            </div>
            <method.Icon className={cn("size-6", method.iconColor)} />
            <h3 className="mt-10 text-sm md:text-base">{method.title}</h3>
            <p className="z-20 mt-2 font-light text-muted-foreground text-xs">
              {method.description}
            </p>
            {method.badge && (
              <Badge
                variant="outline"
                size="sm"
                className="border-blue-400/70 ml-auto opacity-80 absolute top-4 right-4"
              >
                {method.badge}
              </Badge>
            )}
          </MethodCardWrapper>
        ))}
      </div>
    </div>
  );
};

export default MethodSelection;
