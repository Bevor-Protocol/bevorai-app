import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { navigation } from "@/utils/navigation";
import { AsyncComponent, HrefProps } from "@/utils/types";
import { Code, Folder, GitBranch, Globe, LucideProps, Upload } from "lucide-react";
import Link from "next/link";
import { ForwardRefExoticComponent, RefAttributes } from "react";

type VersionProps = {
  Icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  iconColor: string;
  title: string;
  description: string;
  cta: string;
  href: (data: HrefProps) => string;
  disabled: boolean;
};

const versionMethods: VersionProps[] = [
  {
    Icon: Upload,
    iconColor: "text-blue-400",
    title: "Upload / Write File",
    description: "Upload your .sol file(s) for analysis, or manually write/paste it",
    cta: "Choose Files",
    href: navigation.project.versions.new.file,
    disabled: false,
  },
  {
    Icon: Folder,
    iconColor: "text-yellow-400",
    title: "Upload Folder",
    description: "Upload and entire folder of solidity files",
    cta: "Choose Folder",
    href: navigation.project.versions.new.folder,
    disabled: false,
  },
  {
    Icon: Globe,
    iconColor: "text-purple-400",
    title: "Explorer Scan",
    description: "Enter a deployed, verified, contract address to analyze",
    cta: "Enter Address",
    href: navigation.project.versions.new.address,
    disabled: false,
  },
  {
    Icon: Code,
    iconColor: "text-orange-400",
    title: "MCP / IDE Integration",
    description: "Integrate directly with your IDE for seamless development",
    cta: "Get Started",
    href: navigation.project.versions.new.ide,
    disabled: true,
  },
  {
    Icon: GitBranch,
    iconColor: "text-white-400",
    title: "Repository Scan",
    description: "Automatically scan and analyze your Git repositories",
    cta: "Get Started",
    href: navigation.project.versions.new.repo,
    disabled: true,
  },
];

interface VersionPageProps {
  params: Promise<{ teamSlug: string; projectSlug: string; versionId: string }>;
}

const NewVersionPage: AsyncComponent<VersionPageProps> = async ({ params }) => {
  const props = await params;

  return (
    <div className="max-w-6xl m-auto">
      <div className="text-center my-8">
        <h1 className="text-3xl font-bold text-neutral-100 mb-4">Add New Version</h1>
        <p className="text-lg text-neutral-400">
          Choose how you&apos;d like to provide your smart contract
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {versionMethods.map((method, ind) => (
          <div
            key={ind}
            className={cn(
              "border border-neutral-800 rounded-lg p-6 transition-all cursor-default h-full flex flex-col",
              !method.disabled && "hover:border-neutral-700",
              method.disabled && "opacity-70",
            )}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div
                className={cn(
                  "size-10 rounded-lg bg-neutral-900 flex items-center justify-center",
                  method.iconColor,
                )}
              >
                <method.Icon className="size-5" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-100">{method.title}</h3>
            </div>
            <p className="text-sm text-neutral-400 mb-4">{method.description}</p>
            {!method.disabled ? (
              <Button className="w-full mt-auto" asChild>
                <Link href={method.href(props)}>{method.cta}</Link>
              </Button>
            ) : (
              <Button variant="outline" className="border-orange-400/70 w-full mt-auto" disabled>
                Coming Soon
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewVersionPage;
