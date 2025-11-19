import { Badge } from "@/components/ui/badge";
import { GridPattern } from "@/components/ui/grid-pattern";
import { cn } from "@/lib/utils";
import { Code, Folder, GitBranch, Globe, LucideProps, Upload } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

type VersionProps = {
  Icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  iconColor: string;
  title: string;
  description: string;
  cta: string;
  disabled: boolean;
  method: string;
};

const versionMethods: VersionProps[] = [
  {
    Icon: Upload,
    iconColor: "text-blue-400",
    title: "Upload / Write File",
    description: "Upload your .sol file(s) for analysis, or manually write/paste it",
    cta: "Choose Files",
    disabled: false,
    method: "file",
  },
  {
    Icon: Folder,
    iconColor: "text-yellow-400",
    title: "Upload Folder",
    description: "Upload an entire folder of solidity files",
    cta: "Choose Folder",
    disabled: false,
    method: "folder",
  },
  {
    Icon: Globe,
    iconColor: "text-purple-400",
    title: "Explorer Scan",
    description: "Enter a deployed, verified contract address to analyze",
    cta: "Enter Address",
    disabled: false,
    method: "scan",
  },
  {
    Icon: Code,
    iconColor: "text-orange-400",
    title: "MCP / IDE Integration",
    description: "Integrate directly with your IDE for seamless development",
    cta: "Get Started",
    disabled: true,
    method: "mcp",
  },
  {
    Icon: GitBranch,
    iconColor: "text-foreground-400",
    title: "Repository Scan",
    description: "Automatically scan and analyze your Git repositories",
    cta: "Get Started",
    disabled: true,
    method: "repo",
  },
];

const MethodSelection: React.FC<{
  setMethod: (method: string) => void;
  nextStep: () => void;
}> = ({ setMethod, nextStep }) => {
  const handleSelection = (method: VersionProps): void => {
    if (method.disabled) return;
    setMethod(method.method);
    nextStep();
  };

  return (
    <div className="max-w-5xl m-auto">
      <h2 className="py-10">Select how you would like to upload a code version</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-y border-t border-l">
        {versionMethods.map((method, ind) => (
          <div
            className={cn(
              "relative overflow-hidden p-6 last:border-r last:border-b group cursor-pointer",
              method.disabled && "opacity-60 pointer-events-none cursor-default",
            )}
            key={ind}
            onClick={() => handleSelection(method)}
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
            {method.disabled && (
              <Badge
                variant="outline"
                className="border-orange-400/70 ml-auto opacity-80 absolute top-4 right-4"
              >
                soon
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MethodSelection;
