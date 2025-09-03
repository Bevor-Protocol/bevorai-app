"use client";

import { AuditFindingsResponseI } from "@/utils/types";
import { AlertTriangle, Info, Shield, XCircle } from "lucide-react";
import { useState } from "react";

const AuditResults: React.FC<{ audit: AuditFindingsResponseI }> = ({ audit }) => {
  const [selectedFinding, setSelectedFinding] = useState<string | null>(null);

  const getSeverityIcon = (level: string): React.ReactElement => {
    switch (level.toLowerCase()) {
      case "critical":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "medium":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "low":
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-neutral-500" />;
    }
  };

  const getSeverityColor = (level: string): string => {
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

  const getSeverityTextColor = (level: string): string => {
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
        return "text-neutral-400";
    }
  };

  // Group findings by level
  const findingsByLevel =
    audit.findings?.reduce(
      (acc, finding) => {
        const level = finding.level?.toLowerCase() || "unknown";
        if (!acc[level]) {
          acc[level] = [];
        }
        acc[level].push(finding);
        return acc;
      },
      {} as Record<string, typeof audit.findings>,
    ) || {};

  const levelOrder = ["critical", "high", "medium", "low", "info", "unknown"];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-100 mb-2">Shared Audit Results</h1>
        </div>
      </div>

      {audit.findings && (
        <div className="space-y-8">
          {/* Severity Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {levelOrder.map((level) => {
              const findings = findingsByLevel[level] || [];
              if (findings.length === 0) return null;

              return (
                <div key={level} className={`border rounded-xl p-4 ${getSeverityColor(level)}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {getSeverityIcon(level)}
                    <span
                      className={`text-sm font-medium capitalize ${getSeverityTextColor(level)}`}
                    >
                      {level}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-neutral-100">{findings.length}</div>
                </div>
              );
            })}
          </div>

          {/* Summary Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-100">Security Findings</h2>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-neutral-400" />
              <span className="text-sm text-neutral-400">
                {audit.findings.length} finding{audit.findings.length === 1 ? "" : "s"} found
              </span>
            </div>
          </div>

          {/* Detailed Findings */}
          <div className="space-y-6">
            {levelOrder.map((level) => {
              const findings = findingsByLevel[level] || [];
              if (findings.length === 0) return null;

              return (
                <div key={level} className="space-y-4">
                  <h3 className={`text-lg font-semibold capitalize ${getSeverityTextColor(level)}`}>
                    {level} Severity ({findings.length})
                  </h3>
                  <div className="space-y-3">
                    {findings.map((finding, index) => (
                      <div
                        key={finding.id || index}
                        className={`border rounded-xl p-5 ${getSeverityColor(level)} cursor-pointer transition-all duration-200 hover:bg-neutral-800/30 hover:border-opacity-40`}
                        onClick={() =>
                          setSelectedFinding(selectedFinding === finding.id ? null : finding.id)
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            {getSeverityIcon(level)}
                            <div className="flex-1 space-y-2">
                              <h4 className="text-base font-medium text-neutral-100">
                                {finding.name || `Finding ${index + 1}`}
                              </h4>
                              {finding.explanation && (
                                <p className="text-sm text-neutral-400 leading-relaxed">
                                  {finding.explanation}
                                </p>
                              )}
                              {selectedFinding === finding.id && (
                                <div className="mt-4 space-y-4 pt-4 border-t border-neutral-700/50">
                                  {finding.recommendation && (
                                    <div>
                                      <h5 className="text-sm font-medium text-neutral-300 mb-2">
                                        Recommendation
                                      </h5>
                                      <p className="text-sm text-neutral-400 leading-relaxed">
                                        {finding.recommendation}
                                      </p>
                                    </div>
                                  )}
                                  {finding.reference && (
                                    <div>
                                      <h5 className="text-sm font-medium text-neutral-300 mb-2">
                                        Reference
                                      </h5>
                                      <p className="text-sm text-neutral-400 leading-relaxed">
                                        {finding.reference}
                                      </p>
                                    </div>
                                  )}
                                  {finding.type && (
                                    <div className="text-sm text-neutral-500">
                                      Type: {finding.type}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-neutral-500 ml-4">
                            {finding.is_attested && (
                              <span className="text-green-400 font-medium">✓ Attested</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditResults;
