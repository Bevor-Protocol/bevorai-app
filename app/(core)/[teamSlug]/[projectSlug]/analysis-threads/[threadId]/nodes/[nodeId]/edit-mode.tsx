"use client";

import { analysisActions } from "@/actions/bevor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { FindingLevel, FindingType } from "@/utils/enums";
import {
  AddAnalysisFindingBody,
  AnalysisFindingBody,
  analysisFindingBodySchema,
} from "@/utils/schema";
import { DraftFindingSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, Info, Plus, RotateCcw, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

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

const levelOrder = [
  FindingLevel.CRITICAL,
  FindingLevel.HIGH,
  FindingLevel.MEDIUM,
  FindingLevel.LOW,
];

type DraftFindingWithScope = DraftFindingSchemaI["findings"][0] & {
  scope: {
    id: string;
    callable: DraftFindingSchemaI["callable"];
  };
};

type MergedFindingWithScope = DraftFindingSchemaI["findings"][0] & {
  scope: {
    id: string;
    callable: DraftFindingSchemaI["callable"];
  };
};

type StagedFindingWithScope = DraftFindingSchemaI["staged"][0] & {
  scope: {
    id: string;
    callable: DraftFindingSchemaI["callable"];
  };
};

const getFindingsCountByLevel = (
  findings: DraftFindingSchemaI["findings"],
): Record<FindingLevel, number> => {
  const counts = {
    [FindingLevel.CRITICAL]: 0,
    [FindingLevel.HIGH]: 0,
    [FindingLevel.MEDIUM]: 0,
    [FindingLevel.LOW]: 0,
  } as Record<FindingLevel, number>;

  findings.forEach((finding) => {
    if (finding.level in counts) {
      counts[finding.level as FindingLevel]++;
    }
  });

  return counts;
};

const EditScopesList: React.FC<{
  teamSlug: string;
  nodeId: string;
  selectedFinding: DraftFindingWithScope | null;
  onSelectFinding: (finding: DraftFindingWithScope) => void;
  onAddFinding: (data: AddAnalysisFindingBody) => void;
}> = ({ teamSlug, nodeId, selectedFinding, onSelectFinding, onAddFinding }) => {
  const [openAddDialog, setOpenAddDialog] = useState<string | null>(null);
  const [openScopes, setOpenScopes] = useState<Set<string>>(new Set());

  const { data: draftScopes = [], isLoading } = useQuery<DraftFindingSchemaI[]>({
    queryKey: generateQueryKey.analysisVersionDraft(nodeId),
    queryFn: () => analysisActions.getDraft(teamSlug, nodeId),
  });

  const sortedScopes = useMemo(() => {
    return [...draftScopes].sort((a, b) => {
      const aCount = a.findings.length;
      const bCount = b.findings.length;
      if (aCount !== bCount) {
        return bCount - aCount;
      }
      return a.callable.name.localeCompare(b.callable.name);
    });
  }, [draftScopes]);

  React.useEffect(() => {
    if (selectedFinding && !openScopes.has(selectedFinding.scope.id)) {
      setOpenScopes(new Set([...openScopes, selectedFinding.scope.id]));
    }
  }, [selectedFinding, openScopes]);

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4 overflow-y-auto pr-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (sortedScopes.length === 0) {
    return <div className="text-sm text-muted-foreground py-4 text-center">No scopes found</div>;
  }

  return (
    <div className="flex flex-col space-y-4 overflow-y-auto pr-2">
      {sortedScopes.map((scope) => {
        const counts = getFindingsCountByLevel(scope.findings);
        const hasFindings = scope.findings.length > 0;
        const isOpen = openScopes.has(scope.id);

        return (
          <Collapsible
            key={scope.id}
            open={isOpen}
            onOpenChange={(open) => {
              const newOpenScopes = new Set(openScopes);
              if (open) {
                newOpenScopes.add(scope.id);
              } else {
                newOpenScopes.delete(scope.id);
              }
              setOpenScopes(newOpenScopes);
            }}
            className="group"
          >
            <div className="space-y-2">
              <CollapsibleTrigger
                className={cn(
                  "w-full text-left flex items-start gap-2 p-2 data-[state=open]:[&>svg]:rotate-180",
                  "rounded-lg hover:bg-accent transition-colors",
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate min-w-0 flex-1">{scope.callable.name}</div>
                    {hasFindings ? (
                      <div className="flex items-center gap-2 shrink-0">
                        {levelOrder.map((level) => {
                          const count = counts[level];
                          if (count === 0) return null;
                          return (
                            <Badge
                              key={level}
                              variant={
                                level === FindingLevel.CRITICAL
                                  ? "destructive"
                                  : level === FindingLevel.HIGH
                                    ? "destructive"
                                    : level === FindingLevel.MEDIUM
                                      ? "secondary"
                                      : "blue"
                              }
                              className="text-xs"
                            >
                              {count} {level}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground shrink-0">No findings</div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono truncate mt-1">
                    {scope.callable.signature}
                  </div>
                </div>
                <ChevronDown className="size-4 mt-1 transition-transform shrink-0" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 ml-6">
                  {!hasFindings ? (
                    <div className="text-sm text-muted-foreground py-2">
                      No findings in this scope
                    </div>
                  ) : (
                    levelOrder.map((level) => {
                      const levelFindings = scope.findings.filter((f) => f.level === level);
                      if (levelFindings.length === 0) return null;

                      return (
                        <div key={level} className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground capitalize">
                            {level}
                          </div>
                          {levelFindings.map((finding, index) => {
                            const findingWithScope: DraftFindingWithScope = {
                              ...finding,
                              scope: {
                                id: scope.id,
                                callable: scope.callable,
                              },
                            };
                            const isSelected = selectedFinding?.id === finding.id;
                            const isDraftDelete = finding.draft_type === "delete";

                            if (isDraftDelete) {
                              return (
                                <div
                                  key={finding.id || index}
                                  className={cn(
                                    "w-full text-left p-2 rounded border flex items-center justify-between group",
                                    getSeverityColor(level),
                                    "border-dashed opacity-50",
                                  )}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {getSeverityIcon(level)}
                                    <span className="text-sm font-medium truncate line-through">
                                      {finding.name}
                                    </span>
                                    <Badge variant="destructive" className="text-xs shrink-0">
                                      Deleting
                                    </Badge>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={finding.id || index}
                                onClick={() => {
                                  onSelectFinding(findingWithScope);
                                  if (!openScopes.has(scope.id)) {
                                    setOpenScopes(new Set([...openScopes, scope.id]));
                                  }
                                }}
                                className={cn(
                                  "w-full text-left p-2 rounded border transition-all duration-200 cursor-pointer",
                                  getSeverityColor(level),
                                  isSelected
                                    ? "border-opacity-60 bg-opacity-10"
                                    : "hover:bg-opacity-10 hover:border-opacity-40",
                                )}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {getSeverityIcon(level)}
                                  <span className="text-sm font-medium truncate">
                                    {finding.name}
                                  </span>
                                  {finding.is_draft && finding.draft_type === "add" && (
                                    <Badge variant="secondary" className="text-xs shrink-0">
                                      New
                                    </Badge>
                                  )}
                                  {finding.is_draft && finding.draft_type === "updated" && (
                                    <Badge variant="secondary" className="text-xs shrink-0">
                                      Modified
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                  <AddFindingDialog
                    scopeId={scope.id}
                    scopeName={scope.callable.name}
                    open={openAddDialog === scope.id}
                    onOpenChange={(open) => setOpenAddDialog(open ? scope.id : null)}
                    onAdd={onAddFinding}
                    isLoading={false}
                  />
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
};

const EditFindingDetail: React.FC<{
  teamSlug: string;
  nodeId: string;
  finding: DraftFindingWithScope | null;
  onFindingDeleted?: (deletedFindingId: string) => void;
  isLoading?: boolean;
}> = ({ teamSlug, nodeId, finding, onFindingDeleted, isLoading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AnalysisFindingBody | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (findingId: string) =>
      analysisActions.deleteStagedFinding(teamSlug, nodeId, findingId),
    onSuccess: ({ toInvalidate }, findingId) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      if (onFindingDeleted) {
        onFindingDeleted(findingId);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ findingId, data }: { findingId: string; data: AnalysisFindingBody }) =>
      analysisActions.updateStagedFinding(teamSlug, nodeId, findingId, data),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setIsEditing(false);
    },
  });

  React.useEffect(() => {
    if (finding) {
      setFormData({
        type: finding.type as FindingType,
        level: finding.level,
        name: finding.name,
        explanation: finding.explanation,
        recommendation: finding.recommendation,
        reference: finding.reference,
      });
      setIsEditing(false);
    }
  }, [finding]);

  const handleSave = (): void => {
    if (!finding || !formData) return;
    const result = analysisFindingBodySchema.safeParse(formData);
    if (result.success) {
      updateMutation.mutate({ findingId: finding.id, data: result.data });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="flex items-center justify-center text-center py-12">
        <div>
          <p className="text-muted-foreground">Select a finding to edit</p>
        </div>
      </div>
    );
  }

  if (isEditing && formData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Finding</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground mb-4">
          Scope: <span className="font-mono">{finding.scope.callable.name}</span>
        </div>
        <Field>
          <FieldLabel>Name</FieldLabel>
          <FieldContent>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel>Type</FieldLabel>
          <FieldContent>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as FindingType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FindingType).map(([, value]) => (
                  <SelectItem key={value} value={value}>
                    {value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel>Level</FieldLabel>
          <FieldContent>
            <Select
              value={formData.level}
              onValueChange={(value) => setFormData({ ...formData, level: value as FindingLevel })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FindingLevel.CRITICAL}>Critical</SelectItem>
                <SelectItem value={FindingLevel.HIGH}>High</SelectItem>
                <SelectItem value={FindingLevel.MEDIUM}>Medium</SelectItem>
                <SelectItem value={FindingLevel.LOW}>Low</SelectItem>
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel>Explanation</FieldLabel>
          <FieldContent>
            <Textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              rows={4}
              required
            />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel>Recommendation</FieldLabel>
          <FieldContent>
            <Textarea
              value={formData.recommendation}
              onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
              rows={4}
              required
            />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel>Reference</FieldLabel>
          <FieldContent>
            <Input
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              required
            />
          </FieldContent>
        </Field>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start gap-4 mb-4">
        {getSeverityIcon(finding.level)}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold">{finding.name}</h3>
            {finding.is_draft && (
              <Badge variant="secondary">
                {finding.draft_type === "add"
                  ? "New"
                  : finding.draft_type === "updated"
                    ? "Modified"
                    : ""}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
            <span className="capitalize font-medium">{finding.level} severity</span>
            <span>•</span>
            <span>
              Type: {finding.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Scope: </span>
            <span className="font-mono">{finding.scope.callable.name}</span>
            <span className="mx-2">•</span>
            <span className="font-mono text-xs">{finding.scope.callable.signature}</span>
          </div>
        </div>
      </div>

      {finding.explanation && (
        <div className="space-y-2 mb-6">
          <h4 className="text-sm font-medium">Description</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{finding.explanation}</p>
        </div>
      )}

      {finding.recommendation && (
        <div className="space-y-2 mb-6">
          <h4 className="text-sm font-medium">Recommendation</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{finding.recommendation}</p>
        </div>
      )}

      {finding.reference && (
        <div className="space-y-2 mb-6">
          <h4 className="text-sm font-medium">Reference</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{finding.reference}</p>
        </div>
      )}

      <div className="pt-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              deleteMutation.mutate(finding.id);
            }}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        </div>
      </div>
    </>
  );
};

const AddFindingDialog: React.FC<{
  scopeId: string;
  scopeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: AddAnalysisFindingBody) => void;
  isLoading: boolean;
}> = ({ scopeId, scopeName, open, onOpenChange, onAdd, isLoading }) => {
  const [formData, setFormData] = useState<AnalysisFindingBody>({
    type: FindingType.LOGIC,
    level: FindingLevel.MEDIUM,
    name: "",
    explanation: "",
    recommendation: "",
    reference: "",
  });

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const result = analysisFindingBodySchema.safeParse(formData);
    if (result.success) {
      onAdd({
        scope_id: scopeId,
        ...result.data,
      } as AddAnalysisFindingBody);
      setFormData({
        type: FindingType.LOGIC,
        level: FindingLevel.MEDIUM,
        name: "",
        explanation: "",
        recommendation: "",
        reference: "",
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full mb-2">
          <Plus className="size-4" />
          Add Finding
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Finding</DialogTitle>
          <DialogDescription>
            Add a new finding to scope: <span className="font-mono">{scopeName}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel>Name</FieldLabel>
            <FieldContent>
              <Input
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter finding name"
                required
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Type</FieldLabel>
            <FieldContent>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as FindingType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FindingType).map(([, value]) => (
                    <SelectItem key={value} value={value}>
                      {value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Level</FieldLabel>
            <FieldContent>
              <Select
                value={formData.level || FindingLevel.MEDIUM}
                onValueChange={(value) =>
                  setFormData({ ...formData, level: value as FindingLevel })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FindingLevel.CRITICAL}>Critical</SelectItem>
                  <SelectItem value={FindingLevel.HIGH}>High</SelectItem>
                  <SelectItem value={FindingLevel.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={FindingLevel.LOW}>Low</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Explanation</FieldLabel>
            <FieldContent>
              <Textarea
                value={formData.explanation || ""}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                placeholder="Enter explanation"
                rows={4}
                required
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Recommendation</FieldLabel>
            <FieldContent>
              <Textarea
                value={formData.recommendation || ""}
                onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                placeholder="Enter recommendation"
                rows={4}
                required
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Reference</FieldLabel>
            <FieldContent>
              <Input
                value={formData.reference || ""}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="Enter reference"
                required
              />
            </FieldContent>
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Finding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const EditClient: React.FC<{
  teamSlug: string;
  nodeId: string;
  projectSlug: string;
  threadId: string;
}> = ({ teamSlug, nodeId, projectSlug, threadId }) => {
  const router = useRouter();
  const [selectedFinding, setSelectedFinding] = useState<DraftFindingWithScope | null>(null);
  const [openCommitDialog, setOpenCommitDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: draftScopes = [] } = useQuery<DraftFindingSchemaI[]>({
    queryKey: generateQueryKey.analysisVersionDraft(nodeId),
    queryFn: () => analysisActions.getDraft(teamSlug, nodeId),
  });

  const addMutation = useMutation({
    mutationFn: (data: AddAnalysisFindingBody) =>
      analysisActions.addStagedFinding(teamSlug, nodeId, data),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
  });

  const commitMutation = useMutation({
    mutationFn: () => analysisActions.commitDraft(teamSlug, nodeId),
    onSuccess: ({ id }) => {
      setOpenCommitDialog(false);
      toast.success("Changes committed successfully");
      router.push(`/${teamSlug}/${projectSlug}/analysis-threads/${threadId}/nodes/${id}`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to commit changes");
    },
  });

  const undoStagedMutation = useMutation({
    mutationFn: (findingId: string) =>
      analysisActions.deleteStagedFinding(teamSlug, nodeId, findingId),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success("Staged change undone");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to undo staged change");
    },
  });

  const allFindings = useMemo(() => {
    const flattened: MergedFindingWithScope[] = [];
    draftScopes.forEach((scope) => {
      scope.findings.forEach((finding) => {
        flattened.push({
          ...finding,
          scope: {
            id: scope.id,
            callable: scope.callable,
          },
        });
      });
    });
    return flattened;
  }, [draftScopes]);

  const stagedFindings = useMemo(() => {
    const staged: StagedFindingWithScope[] = [];
    draftScopes.forEach((scope) => {
      scope.staged.forEach((finding) => {
        staged.push({
          ...finding,
          scope: {
            id: scope.id,
            callable: scope.callable,
          },
        });
      });
    });
    return staged;
  }, [draftScopes]);

  const initialFinding = useMemo(() => {
    if (allFindings.length === 0) return null;
    for (const level of levelOrder) {
      const firstFinding = allFindings.find((finding) => finding.level === level);
      if (firstFinding) {
        return firstFinding;
      }
    }
    return null;
  }, [allFindings]);

  React.useEffect(() => {
    if (initialFinding && !selectedFinding) {
      setSelectedFinding(initialFinding);
    }
  }, [initialFinding, selectedFinding]);

  const handleFindingDeleted = (deletedFindingId: string): void => {
    console.log(deletedFindingId);
    console.log(selectedFinding);
    console.log(allFindings);
    if (selectedFinding?.id === deletedFindingId) {
      const nextFinding = allFindings.find((f) => f.id !== deletedFindingId) || null;
      setSelectedFinding(nextFinding);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Edit Mode</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 h-[600px]">
        <EditScopesList
          teamSlug={teamSlug}
          nodeId={nodeId}
          selectedFinding={selectedFinding}
          onSelectFinding={setSelectedFinding}
          onAddFinding={(data) => addMutation.mutate(data)}
        />
        <div className="flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div
              className={cn(
                "border rounded-xl p-6",
                selectedFinding ? getSeverityColor(selectedFinding.level) : "border-border",
              )}
            >
              <EditFindingDetail
                teamSlug={teamSlug}
                nodeId={nodeId}
                finding={selectedFinding}
                onFindingDeleted={handleFindingDeleted}
                isLoading={false}
              />
            </div>
          </div>
          {stagedFindings.length > 0 && (
            <div className="border-t border-border pt-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">
                    {stagedFindings.length} staged change{stagedFindings.length !== 1 ? "s" : ""}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {stagedFindings.filter((f) => f.draft_type === "add").length} to add,{" "}
                    {stagedFindings.filter((f) => f.draft_type === "updated").length} to update,{" "}
                    {stagedFindings.filter((f) => f.draft_type === "delete").length} to delete
                  </p>
                </div>
                <AlertDialog open={openCommitDialog} onOpenChange={setOpenCommitDialog}>
                  <Button
                    onClick={() => setOpenCommitDialog(true)}
                    disabled={commitMutation.isPending}
                    size="sm"
                  >
                    {commitMutation.isPending ? "Committing..." : "Commit Changes"}
                  </Button>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Commit Changes</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will create a new analysis version with your staged changes and set the
                        current version as its parent. Are you sure you want to continue?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => commitMutation.mutate()}
                        disabled={commitMutation.isPending}
                      >
                        {commitMutation.isPending ? "Committing..." : "Commit Changes"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {levelOrder.map((level) => {
                  const levelFindings = stagedFindings.filter((f) => f.level === level);
                  if (levelFindings.length === 0) return null;

                  return (
                    <div key={level} className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground capitalize">
                        {level}
                      </div>
                      {levelFindings.map((finding) => {
                        const isDraftDelete = finding.draft_type === "delete";
                        return (
                          <div
                            key={finding.id}
                            className={cn(
                              "w-full text-left p-2 rounded border text-sm",
                              getSeverityColor(level),
                              isDraftDelete && "border-dashed opacity-50",
                            )}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {getSeverityIcon(level)}
                              <span
                                className={cn(
                                  "font-medium truncate flex-1",
                                  isDraftDelete && "line-through",
                                )}
                              >
                                {finding.name}
                              </span>
                              {finding.draft_type === "add" && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  New
                                </Badge>
                              )}
                              {finding.draft_type === "updated" && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  Modified
                                </Badge>
                              )}
                              {isDraftDelete && (
                                <Badge variant="destructive" className="text-xs shrink-0">
                                  Deleting
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 shrink-0"
                                onClick={() => undoStagedMutation.mutate(finding.id)}
                                disabled={undoStagedMutation.isPending}
                                title="Undo staged change"
                              >
                                <RotateCcw className="size-3" />
                              </Button>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 truncate">
                              {finding.scope.callable.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
