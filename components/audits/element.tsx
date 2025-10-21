import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
import { AuditObservationI } from "@/utils/types";
import { Clock, Lock, Shield, Unlock } from "lucide-react";
import Link from "next/link";
import React from "react";

type AuditElementProps = {
  audit: AuditObservationI;
  teamSlug: string;
  isPreview?: boolean;
};

export const AuditElementLoader: React.FC = () => {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="size-6 rounded-lg" />
            <div className="flex items-center space-x-3">
              <Skeleton className="w-24 h-4" />
              <div className="flex items-center space-x-1">
                <Skeleton className="w-3 h-3" />
                <Skeleton className="w-20 h-3" />
              </div>
            </div>
          </div>
          <Skeleton className="size-4" />
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
  return (
    <div className="border border-border hover:border-border-accent transition-all rounded-lg p-4">
      <Link
        href={navigation.audit.overview({
          teamSlug,
          projectSlug: audit.project_slug,
          auditId: audit.id,
        })}
        className="flex items-center gap-3 flex-1"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="size-4 text-purple-400" />
            <div className="flex items-center space-x-3">
              <h3 className="text-sm font-medium text-foreground">Audit #{audit.id.slice(-8)}</h3>
              <div className="flex items-center space-x-1 text-xs text-neutral-500">
                <Clock className="size-3" />
                <span>{formatDate(audit.created_at)}</span>
              </div>
            </div>
          </div>
          <div className="size-4">
            {audit.is_public ? (
              <Unlock className="size-3 text-green-500" />
            ) : (
              <Lock className="size-3 text-purple-400" />
            )}
          </div>
        </div>
        <div className="flex items-center justify-between pl-7">
          <div className="flex items-center space-x-3">
            <div className="text-xs text-muted-foreground">
              {audit.n_versions} version{audit.n_versions !== 1 ? "s" : ""} audited
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Order: {audit.n}</div>
        </div>
      </Link>
    </div>
  );
};
