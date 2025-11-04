"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { FindingLevel } from "@/utils/enums";
import { AnalysisVersionSchemaI } from "@/utils/types";
import { AlertTriangle, ChevronDown, GitBranch, Info, Shield, XCircle } from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";

const getSeverityIcon = (level: FindingLevel): React.ReactElement => {
  switch (level.toLowerCase()) {
    case "critical":
      return <XCircle className="size-4 text-red-500" />;
    case "high":
      return <AlertTriangle className="size-4 text-orange-500" />;
    case "medium":
      return <AlertTriangle className="size-4 text-yellow-500" />;
    case "low":
      return <Info className="size-4 text-blue-500" />;
    default:
      return <Info className="size-4 text-neutral-500" />;
  }
};

const getSeverityColor = (level: FindingLevel): string => {
  switch (level.toLowerCase()) {
    case "critical":
      return "border-red-500/20 bg-red-500/5";
    case "high":
      return "border-orange-500/20 bg-orange-500/5";
    case "medium":
      return "border-yellow-500/20 bg-yellow-500/5";
    case "low":
      return "border-blue-500/20 bg-blue-500/5";
    default:
      return "border-neutral-500/20 bg-neutral-500/5";
  }
};

const getSeverityTextColor = (level: FindingLevel): string => {
  switch (level.toLowerCase()) {
    case "critical":
      return "text-red-400";
    case "high":
      return "text-orange-400";
    case "medium":
      return "text-yellow-400";
    case "low":
      return "text-blue-400";
    default:
      return "text-muted-foreground";
  }
};

const FINDINGS_PER_PAGE = 10;

const levelOrder = ["critical", "high", "medium", "low"];

export const Relations: React.FC<{
  analysisVersion: AnalysisVersionSchemaI;
  teamId: string;
}> = ({ analysisVersion, teamId }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-4">
          <GitBranch className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <div className="p-2 text-sm">
          <div className="mb-2">
            <span className="font-medium">Parent: </span>
            {analysisVersion.parent_version_id ? (
              <Link
                href={`/teams/${teamId}/analysis-versions/${analysisVersion.parent_version_id}`}
                className="text-blue-400 hover:underline"
              >
                {analysisVersion.parent_version_id.slice(0, 6)}
              </Link>
            ) : (
              <span className="text-muted-foreground">none</span>
            )}
          </div>

          <div>
            <span className="font-medium">Children: </span>
            {analysisVersion.children.map((child) => (
              <Link
                key={child}
                href={`/teams/${teamId}/analysis-versions/${child}`}
                className="text-blue-400 hover:underline"
              >
                {child.slice(0, 6)}
              </Link>
            ))}
            {analysisVersion.children.length === 0 && (
              <span className="text-muted-foreground">none</span>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const AnalysisVersionClient: React.FC<{ analysisVersion: AnalysisVersionSchemaI }> = ({
  analysisVersion,
}) => {
  const [selectedFinding, setSelectedFinding] = useState<
    AnalysisVersionSchemaI["findings"][0] | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);

  const allFindings = useMemo(() => analysisVersion.findings || [], [analysisVersion.findings]);
  const totalPages = Math.ceil(allFindings.length / FINDINGS_PER_PAGE);
  const startIndex = (currentPage - 1) * FINDINGS_PER_PAGE;
  const endIndex = startIndex + FINDINGS_PER_PAGE;
  const paginatedFindings = allFindings.slice(startIndex, endIndex);

  const getFindingsByLevelForPage = (): Record<string, typeof analysisVersion.findings> => {
    const pageFindingsByLevel: Record<string, typeof analysisVersion.findings> = {};

    paginatedFindings.forEach((finding) => {
      const level = finding.level.toLowerCase();
      if (!pageFindingsByLevel[level]) {
        pageFindingsByLevel[level] = [];
      }
      pageFindingsByLevel[level].push(finding);
    });

    return pageFindingsByLevel;
  };

  const pageFindingsByLevel = getFindingsByLevelForPage();

  React.useEffect(() => {
    if (allFindings.length > 0) {
      for (const level of levelOrder) {
        const firstFinding = allFindings.find((finding) => finding.level === level);
        if (firstFinding) {
          setSelectedFinding(firstFinding);
          return;
        }
      }
    }
  }, [allFindings]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-purple-400" />
          <h2 className="text-xl font-semibold">Security Findings</h2>
          <Badge variant="purple">{analysisVersion.n_findings} findings</Badge>
        </div>

        {allFindings.length > FINDINGS_PER_PAGE && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {startIndex + 1}-{Math.min(endIndex, allFindings.length)} of{" "}
              {allFindings.length}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 h-[600px]">
        <div className="flex flex-col space-y-4 overflow-y-auto pr-2">
          {levelOrder.map((level) => {
            const findings = pageFindingsByLevel[level] || [];
            return (
              <Collapsible
                key={level + String(!!selectedFinding)} // forces update on useEffect of initial mount
                defaultOpen={selectedFinding?.level === level}
                className="group"
              >
                <div className="space-y-2">
                  <CollapsibleTrigger
                    className={cn(
                      "w-full text-left flex items-center gap-2 p-2 data-[state=open]:[&>svg]:rotate-180",
                      findings.length > 0 && "rounded-lg hover:bg-accent transition-colors",
                      getSeverityTextColor(level as FindingLevel),
                    )}
                    disabled={!findings.length}
                  >
                    {getSeverityIcon(level as FindingLevel)}
                    <span className="capitalize font-medium">
                      {level} ({findings.length})
                    </span>
                    <ChevronDown className="size-4 ml-auto transition-transform" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2 ml-6">
                      {findings.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-2">
                          No {level} findings
                        </div>
                      ) : (
                        findings.map((finding, index) => {
                          const isSelected = selectedFinding?.id === finding.id;

                          return (
                            <div
                              key={finding.id || index}
                              onClick={() => setSelectedFinding(finding)}
                              className={cn(
                                "w-full text-left p-2 rounded border transition-all duration-200",
                                getSeverityColor(finding.level),
                                isSelected
                                  ? "border-opacity-60 bg-opacity-10"
                                  : "hover:bg-opacity-10 hover:border-opacity-40",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                {getSeverityIcon(finding.level)}
                                <span className="text-sm font-medium text-foreground truncate">
                                  {finding.name}
                                </span>
                                {finding.is_attested && (
                                  <span className="text-green-400 font-medium text-xs shrink-0">
                                    ✓
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>

        <div className="flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div
              className={cn(
                "border rounded-xl p-6",
                selectedFinding ? getSeverityColor(selectedFinding.level) : "border-border",
              )}
            >
              {selectedFinding ? (
                <>
                  <div className="flex items-start gap-4 mb-4">
                    {getSeverityIcon(selectedFinding.level)}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {selectedFinding.name}
                        </h3>
                        {selectedFinding.is_attested && (
                          <Badge variant="green" className="ml-4">
                            ✓ Attested
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="capitalize font-medium">
                          {selectedFinding.level} severity
                        </span>
                        <span>•</span>
                        <span>Type: {selectedFinding.type}</span>
                      </div>
                    </div>
                  </div>

                  {selectedFinding.explanation && (
                    <div className="space-y-2 mb-6">
                      <h4 className="text-sm font-medium text-foreground">Description</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedFinding.explanation}
                      </p>
                    </div>
                  )}

                  {selectedFinding.recommendation && (
                    <div className="space-y-2 mb-6">
                      <h4 className="text-sm font-medium text-foreground">Recommendation</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedFinding.recommendation}
                      </p>
                    </div>
                  )}

                  {selectedFinding.reference && (
                    <div className="space-y-2 mb-6">
                      <h4 className="text-sm font-medium text-foreground">Reference</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedFinding.reference}
                      </p>
                    </div>
                  )}

                  {selectedFinding.feedback && (
                    <div className="space-y-2 mb-6">
                      <h4 className="text-sm font-medium text-foreground">Feedback</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedFinding.feedback}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border/50">
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Function ID:</span>
                        <br />
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {selectedFinding.function_id}
                        </code>
                      </div>
                      <div>
                        <span className="font-medium">Verified:</span>
                        <br />
                        <span
                          className={
                            selectedFinding.is_verified ? "text-green-400" : "text-red-400"
                          }
                        >
                          {selectedFinding.is_verified ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center text-center py-12">
                  <div>
                    <Shield className="size-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Findings</h3>
                    <p className="text-muted-foreground">
                      This analysis version has no security findings.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    "px-3 py-1 text-sm border rounded",
                    currentPage === pageNum
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-accent",
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border border-border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
