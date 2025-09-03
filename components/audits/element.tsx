import { Skeleton } from "@/components/ui/loader";
import { formatDate } from "@/utils/helpers";
import { AuditObservationI } from "@/utils/types";
import { Clock, Lock, Shield, Unlock } from "lucide-react";
import Link from "next/link";
import React from "react";

type AuditElementProps = {
  audit: AuditObservationI;
  teamSlug: string;
};

export const AuditElementLoader: React.FC = () => {
  return (
    <div className="border border-neutral-800 rounded-lg p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-6 h-6 rounded-lg" />
            <div className="flex items-center space-x-3">
              <Skeleton className="w-24 h-4" />
              <div className="flex items-center space-x-1">
                <Skeleton className="w-3 h-3" />
                <Skeleton className="w-20 h-3" />
              </div>
            </div>
          </div>
          <Skeleton className="w-4 h-4" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-8 h-3" />
            <Skeleton className="w-8 h-3" />
            <Skeleton className="w-8 h-3" />
            <Skeleton className="w-8 h-3" />
          </div>
          <Skeleton className="w-24 h-3" />
        </div>
      </div>
    </div>
  );
};

export const AuditElement: React.FC<AuditElementProps> = ({ audit, teamSlug }) => {
  const totalFindings =
    audit.findings.n_critical +
    audit.findings.n_high +
    audit.findings.n_medium +
    audit.findings.n_low;

  return (
    <div className="border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-all">
      <Link
        href={`/teams/${teamSlug}/projects/${audit.project_slug}/audits/${audit.id}`}
        className="block"
      >
        <div className="space-y-3">
          {/* Top row: Audit info, date, and visibility */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Shield className="w-3 h-3 text-purple-400" />
              </div>
              <div className="flex items-center space-x-3">
                <h3 className="text-sm font-medium text-neutral-100">
                  Audit #{audit.id.slice(-8)}
                </h3>
                <div className="flex items-center space-x-1 text-xs text-neutral-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(audit.created_at)}</span>
                </div>
              </div>
            </div>
            {/* Visibility icon */}
            <div className="w-4 h-4">
              {audit.is_public ? (
                <Unlock className="w-4 h-4 text-green-500" />
              ) : (
                <Lock className="w-4 h-4 text-purple-400" />
              )}
            </div>
          </div>
          <div className="flex items-center justify-between pl-9">
            <div className="flex items-center space-x-3">
              {audit.findings.n_critical > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-xs text-red-400">{audit.findings.n_critical}</span>
                </div>
              )}
              {audit.findings.n_high > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-xs text-orange-400">{audit.findings.n_high}</span>
                </div>
              )}
              {audit.findings.n_medium > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-xs text-yellow-400">{audit.findings.n_medium}</span>
                </div>
              )}
              {audit.findings.n_low > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-blue-400">{audit.findings.n_low}</span>
                </div>
              )}
            </div>
            <div className="text-xs text-neutral-400">{totalFindings} total findings</div>
          </div>
        </div>
      </Link>
    </div>
  );
};
