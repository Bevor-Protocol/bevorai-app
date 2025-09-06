import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { formatDate, truncateVersion } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
import { AsyncComponent, SourceTypeEnum } from "@/utils/types";
import { Calendar, ExternalLink, Network, Plus } from "lucide-react";
import Link from "next/link";

interface LayoutProps {
  params: Promise<{ teamSlug: string; projectSlug: string; versionId: string }>;
  children: React.ReactNode;
}

const getSourceCopy = (sourceType: SourceTypeEnum): string => {
  switch (sourceType) {
    case SourceTypeEnum.SCAN:
      return "Address";
    case SourceTypeEnum.PASTE:
    case SourceTypeEnum.UPLOAD_FILE:
    case SourceTypeEnum.UPLOAD_FOLDER:
      return "Hash";
    case SourceTypeEnum.REPOSITORY:
      return "Commit";
    default:
      return "Version";
  }
};

const VersionLayout: AsyncComponent<LayoutProps> = async ({ params, children }) => {
  const slugs = await params;

  const version = await bevorAction.getContractVersion(slugs.versionId);
  return (
    <div className="max-w-6xl m-auto">
      <div className="flex flex-row justify-between mb-8 border-b border-b-neutral-800 py-4">
        <div>
          <h1>
            Version{" - "}
            {truncateVersion({
              versionMethod: version.version_identifier,
              versionIdentifier: version.version_identifier,
            })}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-neutral-400 mt-2">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Created {formatDate(version.created_at)}</span>
            </div>
            {version.network && (
              <div className="flex items-center space-x-1">
                <Network className="w-4 h-4" />
                <span>{version.network}</span>
              </div>
            )}
            {version.solc_version && (
              <div className="flex items-center space-x-1">
                <span className="text-xs bg-neutral-800 px-2 py-1 rounded">
                  Solidity {version.solc_version}
                </span>
              </div>
            )}
            {version.source_url && (
              <div>
                <span className="text-neutral-400">Source URL:</span>
                <span className="ml-2 text-blue-400 flex items-center space-x-1">
                  <span>View Source</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <span>Method: {version.source_type}</span>
            </div>
          </div>
        </div>
        <Link href={navigation.version.audits.new(slugs)}>
          <Button className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Audit</span>
          </Button>
        </Link>
      </div>
      {children}
    </div>
  );
};

export default VersionLayout;
