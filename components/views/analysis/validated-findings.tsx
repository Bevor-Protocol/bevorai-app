"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useValidatedFindings } from "@/hooks/useValidatedFindings";
import { cn } from "@/lib/utils";
import { FindingSchemaI, ProjectValidatedFinding } from "@/utils/types";
import {
  Check,
  ChevronDown,
  ClipboardCheck,
  Info,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Wrench,
} from "lucide-react";
import React, { useState } from "react";
import { getSeverityBadgeClasses, getSeverityIcon } from "./scopes";

interface ValidatedFindingsPanelProps {
  projectSlug: string;
  codeVersionId: string;
  username: string;
  onSelectFinding?: (finding: FindingSchemaI) => void;
  currentFindings: Map<string, FindingSchemaI>;
  selectedFindingId?: string;
}

const ActiveRow: React.FC<{
  finding: ProjectValidatedFinding;
  isSelected: boolean;
  isFromCurrentVersion: boolean;
  onClick?: () => void;
  onRemediate: () => void;
  onRemove: () => void;
}> = ({ finding, isSelected, isFromCurrentVersion, onClick, onRemediate, onRemove }) => (
  <div
    onClick={onClick}
    className={cn(
      "group flex items-center gap-2 px-2.5 py-2 rounded-md border transition-colors",
      onClick ? "cursor-pointer" : "cursor-default",
      isFromCurrentVersion
        ? "border-green-500/20 bg-background hover:bg-green-500/8"
        : "border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10",
      isSelected && "ring-1 ring-green-500/30 border-green-500/40",
    )}
  >
    {getSeverityIcon(finding.level)}
    <span className="text-xs font-medium truncate flex-1 min-w-0">{finding.name}</span>
    <Badge
      variant="outline"
      className={cn("text-[10px] shrink-0 px-1.5 py-0", getSeverityBadgeClasses(finding.level))}
    >
      {finding.level}
    </Badge>
    {!isFromCurrentVersion && (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-yellow-500 shrink-0">
            <Info className="size-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-56 text-xs">
          Found in a different code version. May have been fixed — consider marking as remediated.
        </TooltipContent>
      </Tooltip>
    )}
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemediate();
            }}
            className="size-6 text-muted-foreground hover:text-green-500"
          >
            <Wrench className="size-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">I fixed this</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="size-6 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">Remove</TooltipContent>
      </Tooltip>
    </div>
    <Check className="size-3.5 text-green-500 shrink-0 group-hover:hidden" />
  </div>
);

const PendingRemediationRow: React.FC<{
  finding: ProjectValidatedFinding;
  username: string;
  codeVersionId: string;
  onConfirm: () => void;
  onRestore: () => void;
  onRemove: () => void;
}> = ({ finding, onConfirm, onRestore, onRemove }) => (
  <div className="group flex items-center gap-2 px-2.5 py-2 rounded-md border border-dashed border-purple-500/30 bg-purple-500/5">
    {getSeverityIcon(finding.level)}
    <span className="text-xs font-medium truncate flex-1 min-w-0 text-muted-foreground">
      {finding.name}
    </span>
    <Badge
      variant="outline"
      className={cn("text-[10px] shrink-0 px-1.5 py-0 opacity-70", getSeverityBadgeClasses(finding.level))}
    >
      {finding.level}
    </Badge>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-purple-400 shrink-0 text-[10px] font-medium italic">AI suggested</span>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-56 text-xs">
        The AI flagged this as likely remediated in a newer code version. Confirm to move it to
        Remediated history.
      </TooltipContent>
    </Tooltip>
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onConfirm}
            className="size-6 text-muted-foreground hover:text-purple-400"
          >
            <Check className="size-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">Confirm — I fixed this</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRestore}
            className="size-6 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">Move back to active</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            className="size-6 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">Remove</TooltipContent>
      </Tooltip>
    </div>
  </div>
);

const RemediatedRow: React.FC<{
  finding: ProjectValidatedFinding;
  onRestore: () => void;
  onRemove: () => void;
}> = ({ finding, onRestore, onRemove }) => (
  <div className="group flex items-center gap-2 px-2.5 py-2 rounded-md border border-purple-500/20 bg-purple-500/5 opacity-80">
    {getSeverityIcon(finding.level)}
    <span className="text-xs font-medium truncate flex-1 min-w-0 line-through text-muted-foreground">
      {finding.name}
    </span>
    <Badge
      variant="outline"
      className={cn("text-[10px] shrink-0 px-1.5 py-0 opacity-60", getSeverityBadgeClasses(finding.level))}
    >
      {finding.level}
    </Badge>
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRestore}
            className="size-6 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">Undo fixed</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            className="size-6 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">Remove</TooltipContent>
      </Tooltip>
    </div>
  </div>
);

const ValidatedFindingsPanel: React.FC<ValidatedFindingsPanelProps> = ({
  projectSlug,
  codeVersionId,
  username,
  onSelectFinding,
  currentFindings,
  selectedFindingId,
}) => {
  const { active, pendingRemediation, remediated, remediate, flagForRemediation, restore, remove, hydrated } =
    useValidatedFindings(projectSlug);
  const [open, setOpen] = useState(true);
  const [remediatedOpen, setRemediatedOpen] = useState(false);

  if (!hydrated) return null;

  const hasRemediatedSection = pendingRemediation.length > 0 || remediated.length > 0;

  return (
    <div className="space-y-3 mb-3">
      {/* Validated Findings — green */}
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="rounded-lg border border-green-500/25 bg-green-500/[0.04]">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <ClipboardCheck className="size-4 text-green-500 shrink-0" />
              <span className="text-sm font-semibold text-foreground flex-1 text-left">
                Validated Findings
              </span>
              {active.length > 0 && (
                <Badge
                  variant="outline"
                  className="border-green-500/30 text-green-500 bg-green-500/10 text-xs tabular-nums"
                >
                  {active.length}
                </Badge>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Info className="size-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-72 text-xs leading-relaxed space-y-1.5">
                  <p className="font-semibold text-foreground">Team-shared source of truth</p>
                  <p className="text-muted-foreground">
                    Validated findings are confirmed vulnerabilities, shared across the whole project
                    team. They persist across analysis runs and code versions.
                  </p>
                  <p className="text-muted-foreground">
                    <span className="text-foreground font-medium">How to add:</span> click{" "}
                    <span className="font-medium text-foreground">Validate</span> on any finding header
                    to promote it here immediately.
                  </p>
                </TooltipContent>
              </Tooltip>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground shrink-0 transition-transform",
                  open && "rotate-180",
                )}
              />
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="border-t border-green-500/15 px-2.5 py-2 space-y-1.5">
              {active.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-1 px-1">
                  None yet — click <span className="font-medium text-foreground">Validate</span> on a
                  finding to add it here.
                </p>
              ) : (
                active.map((vf) => {
                  const sourceFinding = currentFindings.get(vf.source_finding_id);
                  const isFromCurrentVersion = vf.code_version_id === codeVersionId;
                  return (
                    <ActiveRow
                      key={vf.id}
                      finding={vf}
                      isSelected={selectedFindingId === vf.source_finding_id}
                      isFromCurrentVersion={isFromCurrentVersion}
                      onClick={sourceFinding ? () => onSelectFinding?.(sourceFinding) : undefined}
                      onRemediate={() => remediate(vf.id, username, codeVersionId)}
                      onRemove={() => remove(vf.id)}
                    />
                  );
                })
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Remediated Validated Findings — purple */}
      {hasRemediatedSection && (
        <Collapsible open={remediatedOpen} onOpenChange={setRemediatedOpen}>
          <div className="rounded-lg border border-purple-500/25 bg-purple-500/[0.04]">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center gap-2 px-3 py-2.5">
                <ShieldCheck className="size-4 text-purple-400 shrink-0" />
                <span className="text-sm font-semibold text-foreground flex-1 text-left">
                  Fixed Findings
                </span>
                {(pendingRemediation.length > 0 || remediated.length > 0) && (
                  <Badge
                    variant="outline"
                    className="border-purple-500/30 text-purple-400 bg-purple-500/10 text-xs tabular-nums"
                  >
                    {pendingRemediation.length + remediated.length}
                  </Badge>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Info className="size-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-72 text-xs leading-relaxed space-y-1.5">
                    <p className="font-semibold text-foreground">Things you've fixed</p>
                    <p className="text-muted-foreground">
                      Move validated findings here once you've fixed them. The AI will suggest
                      candidates (shown as dashed rows) when a new code version no longer surfaces a
                      finding — but you have to confirm each one.
                    </p>
                    <p className="text-muted-foreground">
                      <span className="text-foreground font-medium">To mark as fixed:</span> use the
                      wrench icon on any validated finding, or confirm an AI suggestion.
                    </p>
                    <p className="text-muted-foreground">
                      <span className="text-foreground font-medium">Regressed, or realize you didn't actually fix it?</span>{" "}
                      Use the undo icon to move it back to active.
                    </p>
                  </TooltipContent>
                </Tooltip>
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground shrink-0 transition-transform",
                    remediatedOpen && "rotate-180",
                  )}
                />
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="border-t border-purple-500/15 px-2.5 py-2 space-y-1.5">
                {pendingRemediation.length === 0 && remediated.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-1 px-1">
                    Nothing marked as fixed yet.
                  </p>
                ) : (
                  <>
                    {pendingRemediation.map((vf) => (
                      <PendingRemediationRow
                        key={vf.id}
                        finding={vf}
                        username={username}
                        codeVersionId={codeVersionId}
                        onConfirm={() => remediate(vf.id, username, codeVersionId)}
                        onRestore={() => restore(vf.id)}
                        onRemove={() => remove(vf.id)}
                      />
                    ))}
                    {remediated.map((vf) => (
                      <RemediatedRow
                        key={vf.id}
                        finding={vf}
                        onRestore={() => restore(vf.id)}
                        onRemove={() => remove(vf.id)}
                      />
                    ))}
                  </>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
    </div>
  );
};

export default ValidatedFindingsPanel;
