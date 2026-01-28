"use client";

import { analysisActions, codeActions } from "@/actions/bevor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Subnav, SubnavButton } from "@/components/ui/subnav";
import { Textarea } from "@/components/ui/textarea";
import AnalysisScopes, {
  getSeverityBadgeClasses,
  levelOrder,
} from "@/components/views/analysis/scopes";
import { cn } from "@/lib/utils";
import { useChat } from "@/providers/chat";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { FindingLevel, FindingType } from "@/utils/enums";
import {
  AddAnalysisFindingBody,
  AnalysisFindingBody,
  analysisFindingBodySchema,
} from "@/utils/schema";
import { DraftFindingSchemaI, DraftSchemaI, isApiError, ScopeSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { Plus, Shield } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { codeToHtml } from "shiki";
import { toast } from "sonner";
import CollapsibleChatPanel from "./collapsible-chat-panel";

export const getScopeForDraftFinding = (
  finding: DraftFindingSchemaI,
  draftSchema: DraftSchemaI,
): ScopeSchemaI => {
  const scope = draftSchema.scopes.find(
    (s) => s.code_version_node_id === finding.code_version_node_id,
  );
  if (!scope) {
    throw new Error(`Scope not found for finding ${finding.id}`);
  }
  return scope;
};

const EditFindingMetadata: React.FC<{
  finding: DraftFindingSchemaI;
}> = ({ finding }) => {
  return (
    <div className="flex items-center gap-3">
      <h3 className="text-lg font-semibold">{finding.name}</h3>
      <Badge variant="outline" className={cn("text-xs", getSeverityBadgeClasses(finding.level))}>
        {finding.level}
      </Badge>
      <span className="text-sm text-muted-foreground">
        {finding.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
      </span>
      {finding.is_draft && (
        <Badge variant="secondary" size="sm">
          {finding.draft_type === "add"
            ? "New"
            : finding.draft_type === "update"
              ? "Modified"
              : finding.draft_type === "delete"
                ? "Deleted"
                : ""}
        </Badge>
      )}
    </div>
  );
};

const EditCodeSnippet: React.FC<{
  teamSlug: string;
  codeVersionId: string;
  codeVersionNodeId: string;
  isEditing: boolean;
}> = ({ teamSlug, codeVersionId, codeVersionNodeId, isEditing }) => {
  const { data: nodeData, isLoading: isLoadingNode } = useQuery({
    queryKey: [QUERY_KEYS.CODES, codeVersionId, "nodes", codeVersionNodeId],
    queryFn: () =>
      codeActions.getNode(teamSlug, codeVersionId, codeVersionNodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: !!codeVersionNodeId && !isEditing,
  });

  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    if (!nodeData?.content || isEditing) {
      setHtml("");
      return;
    }

    const highlightCode = async (): Promise<void> => {
      try {
        const result = await codeToHtml(nodeData.content, {
          lang: "solidity",
          theme: "github-dark",
          colorReplacements: {},
        });
        setHtml(result);
      } catch (error) {
        console.error("Error highlighting code:", error);
        const fallbackHtml = `<pre><code>${nodeData.content}</code></pre>`;
        setHtml(fallbackHtml);
      }
    };

    highlightCode();
  }, [nodeData?.content, isEditing]);

  return (
    <div className="border rounded-lg flex-1 min-h-0 flex flex-col">
      <ScrollArea className="p-2 flex-1 min-h-[300px]">
        {isLoadingNode || !html ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/6" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/6" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ) : (
          <div
            className="shiki-container overflow-x-auto w-full"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

const EditFindingTabs: React.FC<{
  finding: DraftFindingSchemaI;
  onEdit: () => void;
  onDelete: () => void;
  onUndo?: () => void;
  isDeleting: boolean;
}> = ({ finding, onEdit, onDelete, onUndo, isDeleting }) => {
  const [tab, setTab] = useState("description");

  return (
    <div className={cn("border rounded-lg overflow-hidden flex flex-col h-[250px]", "finding")}>
      <Subnav className="w-fit px-0">
        <SubnavButton
          isActive={tab === "description"}
          shouldHighlight
          onClick={() => setTab("description")}
        >
          Description
        </SubnavButton>
        <SubnavButton
          isActive={tab === "recommendation"}
          shouldHighlight
          onClick={() => setTab("recommendation")}
        >
          Recommendation
        </SubnavButton>
      </Subnav>
      {tab === "description" && (
        <div className="space-y-4 p-4">
          {finding.explanation && <p className="text-sm leading-relaxed">{finding.explanation}</p>}
          {finding.reference && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase">Reference</h4>
              <p className="text-sm leading-relaxed">{finding.reference}</p>
            </div>
          )}
          {!finding.explanation && !finding.reference && (
            <p className="text-sm text-muted-foreground">No description or reference available.</p>
          )}
        </div>
      )}
      {tab === "recommendation" && (
        <div className="space-y-4 p-4">
          {finding.recommendation ? (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {finding.recommendation}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No recommendation available.</p>
          )}
        </div>
      )}

      <div className="px-4 pb-4 mt-4">
        <div className="flex items-center justify-between">
          {finding.draft_type === "delete" ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                This finding is staged for deletion
              </span>
              {onUndo && (
                <Button variant="outline" size="sm" onClick={onUndo}>
                  Revert
                </Button>
              )}
            </div>
          ) : (
            <>
              <Button variant="destructive" size="sm" onClick={onDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit}>
                Edit
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const EditFindingDetail: React.FC<{
  teamSlug: string;
  nodeId: string;
  codeVersionId: string;
  finding: DraftFindingSchemaI | null;
  draftQuery: UseQueryResult<DraftSchemaI, Error>;
  onFindingDeleted?: (deletedFindingId: string) => void;
  onUndoStagedChange?: (findingId: string) => void;
  setSelectedFinding: React.Dispatch<React.SetStateAction<DraftFindingSchemaI | null>>;
}> = ({
  teamSlug,
  nodeId,
  codeVersionId,
  finding,
  draftQuery,
  onFindingDeleted,
  onUndoStagedChange,
  setSelectedFinding,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AnalysisFindingBody | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (findingId: string) =>
      analysisActions.deleteStagedFinding(teamSlug, nodeId, findingId).then((r) => {
        console.log(r);
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: ({ toInvalidate }, findingId) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      if (onFindingDeleted) {
        onFindingDeleted(findingId);
      }
    },
    onError: (err) => {
      if (isApiError(err)) {
        toast.error(err.error.message, {
          action: {
            label: "view",
            onClick: () => console.log(err.error.code),
          },
        });
      } else {
        console.log("is not api error", err);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ findingId, data }: { findingId: string; data: AnalysisFindingBody }) =>
      analysisActions.updateStagedFinding(teamSlug, nodeId, findingId, data).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: ({ toInvalidate }, { findingId, data }) => {
      for (const f of draftQuery.data?.findings ?? []) {
        if (f.id == findingId) {
          setSelectedFinding({
            ...f,
            ...data,
            draft_type: f.draft_type || "update",
          });
        }
      }
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setIsEditing(false);
    },
  });

  useEffect(() => {
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

  if (draftQuery.isLoading) {
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
          <Shield className="size-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Finding Selected</h3>
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
    <div className="flex flex-col gap-2 w-full h-full min-h-0 overflow-hidden">
      <EditFindingMetadata finding={finding} />
      <EditCodeSnippet
        teamSlug={teamSlug}
        codeVersionId={codeVersionId}
        codeVersionNodeId={
          draftQuery.data
            ? getScopeForDraftFinding(finding, draftQuery.data).code_version_node_id
            : ""
        }
        isEditing={isEditing}
      />
      <EditFindingTabs
        finding={finding}
        onEdit={() => setIsEditing(true)}
        onDelete={() => deleteMutation.mutate(finding.id)}
        onUndo={
          finding.draft_type === "delete" && onUndoStagedChange
            ? (): void => onUndoStagedChange(finding.id)
            : undefined
        }
        isDeleting={deleteMutation.isPending}
      />
    </div>
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
}> = ({ teamSlug, nodeId, projectSlug }) => {
  const [selectedFinding, setSelectedFinding] = useState<DraftFindingSchemaI | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState<string | null>(null);
  const [shouldResetFinding, setShouldResetFinding] = useState("");
  const queryClient = useQueryClient();
  const { removeFinding, attributes } = useChat();

  const draftQuery = useQuery({
    queryKey: generateQueryKey.analysisDraft(nodeId),
    queryFn: () =>
      analysisActions.getDraft(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const findingContext = useMemo(() => {
    if (!draftQuery.data) return [];
    const findingAttributeIds = new Set(
      attributes.filter((attr) => attr.type === "finding").map((attr) => attr.id),
    );
    return draftQuery.data.findings.filter((finding) => findingAttributeIds.has(finding.id));
  }, [attributes, draftQuery.data]);

  const removeFindingFromContext = (findingId: string): void => {
    removeFinding(findingId);
  };

  const addMutation = useMutation({
    mutationFn: (data: AddAnalysisFindingBody) =>
      analysisActions.addStagedFinding(teamSlug, nodeId, data).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
  });

  const undoStagedMutation = useMutation({
    mutationFn: (findingId: string) =>
      analysisActions.deleteStagedFinding(teamSlug, nodeId, findingId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: ({ toInvalidate }, findingId) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success("Staged change undone");
      if (selectedFinding?.id === findingId && draftQuery.data) {
        const baseFindingId = draftQuery.data.staged.find(
          (f) => f.id === findingId,
        )?.base_finding_id;
        if (baseFindingId) {
          const baseFinding = draftQuery.data.findings.find((f) => f.id === baseFindingId);
          if (baseFinding) {
            setSelectedFinding(baseFinding);
          }
        }
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to undo staged change");
    },
  });

  useEffect(() => {
    if (!selectedFinding && draftQuery.data && draftQuery.data.findings.length > 0) {
      for (const level of levelOrder) {
        const firstFinding = draftQuery.data.findings.find((finding) => finding.level === level);
        if (firstFinding) {
          setSelectedFinding(firstFinding);
          break;
        }
      }
    }
  }, [selectedFinding, draftQuery.data]);

  useEffect(() => {
    // TODO: generally figure out how to update the finding.is_draft Badge at the top.
    if (draftQuery.data?.findings.length || !shouldResetFinding) return;
    const baseFinding = draftQuery.data?.findings.find(
      (finding) => finding.id === shouldResetFinding,
    );
    if (baseFinding) {
      setSelectedFinding(baseFinding);
    }
    setShouldResetFinding("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftQuery.data?.findings]);

  const handleFindingDeleted = (deletedFindingId: string): void => {
    if (selectedFinding?.id === deletedFindingId && draftQuery.data) {
      const remainingFindings = draftQuery.data.findings.filter((f) => f.id !== deletedFindingId);
      if (remainingFindings.length > 0) {
        for (const level of levelOrder) {
          const firstFinding = remainingFindings.find((finding) => finding.level === level);
          if (firstFinding) {
            setSelectedFinding(firstFinding);
            return;
          }
        }
      } else {
        setSelectedFinding(null);
      }
    }
  };

  const mergedVersion = useMemo(() => {
    if (!draftQuery.data) return undefined;

    const deletedFindings = draftQuery.data.staged.filter(
      (f) => f.draft_type === "delete",
    ) as DraftFindingSchemaI[];

    return {
      ...draftQuery.data,
      findings: [...draftQuery.data.findings, ...deletedFindings],
      n_findings: draftQuery.data.findings.length + deletedFindings.length,
    };
  }, [draftQuery.data]);

  return (
    <div className="flex flex-1 min-h-0 gap-4">
      <div className="min-h-0 min-w-0 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 min-w-0 max-w-full h-full">
          <AnalysisScopes
            version={mergedVersion}
            selectedFinding={selectedFinding || undefined}
            onSelectFinding={setSelectedFinding}
            disableGrouping={true}
            checkScopeStatus={false}
            onUndoStagedChange={(findingId) => undoStagedMutation.mutate(findingId)}
            renderAddFinding={(scopeId, scopeName) => (
              <AddFindingDialog
                scopeId={scopeId}
                scopeName={scopeName}
                open={openAddDialog === scopeId}
                onOpenChange={(open) => setOpenAddDialog(open ? scopeId : null)}
                onAdd={(data) => addMutation.mutate(data)}
                isLoading={false}
              />
            )}
          />
          {!selectedFinding ? (
            <div className="flex items-center justify-center text-center py-12">
              <div>
                <Shield className="size-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Finding Selected</h3>
                <p className="text-muted-foreground">Select a finding to edit</p>
              </div>
            </div>
          ) : (
            <EditFindingDetail
              teamSlug={teamSlug}
              nodeId={nodeId}
              codeVersionId={draftQuery.data?.code_version_id ?? ""}
              finding={selectedFinding}
              draftQuery={draftQuery}
              onFindingDeleted={handleFindingDeleted}
              onUndoStagedChange={(findingId) => undoStagedMutation.mutate(findingId)}
              setSelectedFinding={setSelectedFinding}
            />
          )}
        </div>
      </div>
      <CollapsibleChatPanel
        teamSlug={teamSlug}
        projectSlug={projectSlug}
        nodeId={nodeId}
        findingContext={findingContext}
        onRemoveFindingFromContext={removeFindingFromContext}
      />
    </div>
  );
};
