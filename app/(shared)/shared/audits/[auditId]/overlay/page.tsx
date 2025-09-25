import { bevorAction } from "@/actions";
import { AsyncComponent, TreeResponseI } from "@/utils/types";
import { Suspense } from "react";
import ScopeOverlayClient from "./scope-overlay-client";

interface AuditOverlayPageProps {
  params: Promise<{ auditId: string }>;
}

// Server component for audit overlay data
const AuditOverlayData: AsyncComponent<{ auditId: string }> = async ({ auditId }) => {
  const audit = await bevorAction.getAudit(auditId);
  const scope = await bevorAction.getAuditScope(auditId);

  // Sort scope data on the server
  const sortedScope: TreeResponseI[] = scope
    .sort((a, b) => {
      if (a.is_within_scope !== b.is_within_scope) {
        return b.is_within_scope ? 1 : -1;
      }
      return a.path.localeCompare(b.path);
    })
    .map((source) => ({
      ...source,
      contracts: source.contracts
        .sort((a, b) => {
          if (a.is_within_scope !== b.is_within_scope) {
            return b.is_within_scope ? 1 : -1;
          }
          return a.name.localeCompare(b.name);
        })
        .map((contract) => ({
          ...contract,
          functions: contract.functions.sort((a, b) => {
            if (a.is_within_scope !== b.is_within_scope) {
              return b.is_within_scope ? 1 : -1;
            }
            return a.src_start_pos - b.src_start_pos;
          }),
        })),
    }));

  return (
    <div className="px-6 py-4 bg-neutral-950 min-h-remaining">
      <ScopeOverlayClient scope={sortedScope} audit={audit} />
    </div>
  );
};

// Loading component
const OverlayLoading: React.FC = () => (
  <div className="px-6 py-4 bg-neutral-950 min-h-remaining">
    <div className="animate-pulse">
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-4">
            <div className="h-6 bg-neutral-800 rounded w-48"></div>
            <div className="h-64 bg-neutral-800 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const AuditOverlayPage: AsyncComponent<AuditOverlayPageProps> = async ({ params }) => {
  const { auditId } = await params;

  return (
    <Suspense fallback={<OverlayLoading />}>
      <AuditOverlayData auditId={auditId} />
    </Suspense>
  );
};

export default AuditOverlayPage;
