"use client";

import { analysisActions, codeActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GraphSnapshotNode } from "@/types/api/responses/graph";
import {
  DraftFindingSchema,
  FindingLevelEnum,
  FindingTypeEnum,
  ScopeSchema,
} from "@/types/api/responses/security";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { truncateId } from "@/utils/helpers";
import { AddAnalysisFindingBody, AnalysisFindingBody } from "@/utils/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const FINDING_TYPE_OPTIONS = Object.values(FindingTypeEnum).filter(
  (v): v is FindingTypeEnum => typeof v === "string",
);
const FINDING_LEVEL_OPTIONS = Object.values(FindingLevelEnum).filter(
  (v): v is FindingLevelEnum => typeof v === "string",
);

const EMPTY_GRAPH_NODES: GraphSnapshotNode[] = [];

const GRAPH_SNAPSHOT_LABEL_CLASS =
  "font-mono truncate max-w-[min(32rem,80vw)] text-xs text-zinc-300";

function lookupScopeRow(
  rawId: string,
  analysisScopes: ScopeSchema[] | undefined,
  graphNodeById: Map<string, GraphSnapshotNode>,
  codeVersionNodes: GraphSnapshotNode[],
): { row: ScopeSchema | GraphSnapshotNode | null; via: "analysisScope" | "graphNode" | "miss" } {
  for (const s of analysisScopes ?? []) {
    if (s.id == rawId || s.source_node_id == rawId) {
      return { row: s, via: "analysisScope" };
    }
  }
  const n =
    graphNodeById.get(String(rawId)) ??
    graphNodeById.get(rawId) ??
    codeVersionNodes.find((node) => node.id == rawId || node.merkle_hash == rawId) ??
    null;
  if (n) return { row: n, via: "graphNode" };
  return { row: null, via: "miss" };
}

type FindingFormDialogCreateProps = {
  mode: "create";
  teamSlug: string;
  nodeId: string;
  codeVersionId: string;
  functionNodes: GraphSnapshotNode[];
  codeVersionNodes: GraphSnapshotNode[];
  functionNodesLoading: boolean;
  fileId: string | null;
  trigger: React.ReactNode;
};

type FindingFormDialogEditProps = {
  mode: "edit";
  teamSlug: string;
  nodeId: string;
  finding: DraftFindingSchema;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FindingFormDialogProps = FindingFormDialogCreateProps | FindingFormDialogEditProps;

export const FindingFormDialog: React.FC<FindingFormDialogProps> = (props) => {
  const queryClient = useQueryClient();
  const isCreate = props.mode === "create";
  const teamSlug = props.teamSlug;
  const nodeId = props.nodeId;

  const [createOpen, setCreateOpen] = useState(false);
  const dialogOpen = isCreate ? createOpen : props.open;
  const setDialogOpen = isCreate
    ? setCreateOpen
    : (o: boolean): void => {
        props.onOpenChange(o);
      };

  const createDialogActive = isCreate && createOpen;
  const codeVersionId = isCreate ? props.codeVersionId : "";
  const fileId = isCreate ? props.fileId : null;
  const functionNodes = isCreate ? props.functionNodes : [];
  const codeVersionNodes = isCreate ? props.codeVersionNodes : EMPTY_GRAPH_NODES;
  const functionNodesLoading = isCreate ? props.functionNodesLoading : false;

  const graphNodeById = useMemo(() => {
    const m = new Map<string, GraphSnapshotNode>();
    for (const n of codeVersionNodes) {
      m.set(String(n.id), n);
      if (n.merkle_hash) m.set(String(n.merkle_hash), n);
    }
    return m;
  }, [codeVersionNodes]);

  const analysisScopesQuery = useQuery({
    queryKey: generateQueryKey.analysisScopes(nodeId),
    queryFn: () =>
      analysisActions.getScopes(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: createDialogActive && !!nodeId,
  });

  const [locationId, setLocationId] = useState("");
  const [selectedScopeIds, setSelectedScopeIds] = useState<Set<string>>(() => new Set());
  const [type, setType] = useState<FindingTypeEnum>(FindingTypeEnum.LOGIC);
  const [level, setLevel] = useState<FindingLevelEnum>(FindingLevelEnum.MEDIUM);
  const [name, setName] = useState("");
  const [explanation, setExplanation] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [reference, setReference] = useState("");

  const scopesForNodeQuery = useQuery({
    queryKey: [QUERY_KEYS.CODES, codeVersionId, "scopesForNode", locationId] as const,
    queryFn: () =>
      codeActions.getScopesForNode(teamSlug, codeVersionId, locationId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: createDialogActive && !!codeVersionId && !!locationId,
  });

  useEffect(() => {
    setSelectedScopeIds(new Set());
  }, [locationId]);

  useEffect(() => {
    if (!createDialogActive || !locationId) return;
    if (scopesForNodeQuery.isFetching) return;
    const ids = scopesForNodeQuery.data;
    if (ids?.length === 1) setSelectedScopeIds(new Set([ids[0]]));
  }, [createDialogActive, locationId, scopesForNodeQuery.data, scopesForNodeQuery.isFetching]);

  const resolveScopeLabel = (rawId: string): ScopeSchema | GraphSnapshotNode | null => {
    return lookupScopeRow(rawId, analysisScopesQuery.data, graphNodeById, codeVersionNodes).row;
  };

  const renderScopeCaption = (scopeRefId: string): React.ReactNode => {
    const row = resolveScopeLabel(scopeRefId);
    if (row) {
      return (
        <span className={GRAPH_SNAPSHOT_LABEL_CLASS}>
          {row.path} · {row.name}
        </span>
      );
    }
    if (analysisScopesQuery.isLoading && !analysisScopesQuery.data) {
      return <span className="text-xs text-zinc-500">Loading…</span>;
    }
    return <span className={GRAPH_SNAPSHOT_LABEL_CLASS}>{truncateId(scopeRefId)}</span>;
  };

  const toggleScopeId = (id: string, checked: boolean): void => {
    setSelectedScopeIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const seedEditForm = (f: DraftFindingSchema): void => {
    setType(f.type);
    setLevel(f.level);
    setName(f.name);
    setExplanation(f.explanation);
    setRecommendation(f.recommendation ?? "");
    setReference(f.reference ?? "");
  };

  const editFindingId = props.mode === "edit" ? props.finding.id : "";
  const editOpen = props.mode === "edit" ? props.open : false;
  useEffect(() => {
    if (props.mode !== "edit" || !editOpen) return;
    seedEditForm(props.finding);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode, editOpen, editFindingId]);

  const invalidateFindings = (): void => {
    void queryClient.invalidateQueries({ queryKey: generateQueryKey.analysisFindings(nodeId) });
  };

  const addMutation = useMutation({
    mutationFn: (body: AddAnalysisFindingBody) =>
      analysisActions.addStagedFinding(teamSlug, nodeId, body).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: () => {
      invalidateFindings();
      toast.success("Finding added");
      setCreateOpen(false);
    },
    onError: () => toast.error("Failed to add finding"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ findingId, data }: { findingId: string; data: AnalysisFindingBody }) =>
      analysisActions.updateStagedFinding(teamSlug, nodeId, findingId, data).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: () => {
      invalidateFindings();
      toast.success("Finding updated");
      if (!isCreate) props.onOpenChange(false);
    },
    onError: () => toast.error("Failed to update finding"),
  });

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!name.trim() || !explanation.trim()) {
      toast.error("Name and explanation are required");
      return;
    }
    if (isCreate) {
      if (!locationId) {
        toast.error("Select a function");
        return;
      }
      if (selectedScopeIds.size < 1) {
        toast.error("Select at least one scope");
        return;
      }
      addMutation.mutate({
        location_id: locationId,
        scope_ids: Array.from(selectedScopeIds),
        type,
        level,
        name: name.trim(),
        explanation: explanation.trim(),
        recommendation: recommendation.trim() || undefined,
        reference: reference.trim() || undefined,
      });
      return;
    }
    if (props.mode !== "edit") return;
    updateMutation.mutate({
      findingId: props.finding.id,
      data: {
        type,
        level,
        name: name.trim(),
        explanation: explanation.trim(),
        recommendation: recommendation.trim() || undefined,
        reference: reference.trim() || undefined,
      },
    });
  };

  const pending = addMutation.isPending || updateMutation.isPending;
  const showLocationAndScopes = isCreate && props.mode === "create";

  const inner = (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>{isCreate ? "Add finding" : "Edit finding"}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? "New findings are staged on this analysis. The list refreshes so you see the draft state."
              : "Updates are staged on this analysis. The list refreshes so you see the draft state."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          {showLocationAndScopes ? (
            <>
              <div className="grid gap-1.5">
                <Label className="text-xs text-zinc-400">Function</Label>
                {functionNodesLoading ? (
                  <p className="text-xs text-zinc-500">Loading functions…</p>
                ) : !fileId ? (
                  <p className="text-xs text-zinc-500">
                    Open a file in the tree to load functions for that file.
                  </p>
                ) : !functionNodes.length ? (
                  <p className="text-xs text-zinc-500">
                    No function or modifier definitions in this file.
                  </p>
                ) : (
                  <Select value={locationId} onValueChange={setLocationId}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select function" />
                    </SelectTrigger>
                    <SelectContent>
                      {functionNodes.map((n) => (
                        <SelectItem key={n.id} value={n.id} className="text-xs">
                          <span className={GRAPH_SNAPSHOT_LABEL_CLASS}>
                            {n.path} · {n.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-zinc-400">
                  {scopesForNodeQuery.data?.length === 1 ? "Scope" : "Scopes (one or more)"}
                </Label>
                {!locationId ? (
                  <p className="text-xs text-zinc-500">Choose a function to load scopes.</p>
                ) : scopesForNodeQuery.isLoading ? (
                  <p className="text-xs text-zinc-500">Loading scopes…</p>
                ) : !scopesForNodeQuery.data?.length ? (
                  <p className="text-xs text-zinc-500">No scopes for this function.</p>
                ) : scopesForNodeQuery.data.length === 1 ? (
                  <div className="min-w-0 pt-0.5">
                    {renderScopeCaption(scopesForNodeQuery.data[0])}
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {scopesForNodeQuery.data.map((sid) => (
                      <label key={sid} className="flex cursor-pointer items-start gap-2 min-w-0">
                        <Checkbox
                          checked={selectedScopeIds.has(sid)}
                          onCheckedChange={(c) => toggleScopeId(sid, c === true)}
                          className="mt-0.5 shrink-0"
                        />
                        <span className="min-w-0 leading-snug">{renderScopeCaption(sid)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label className="text-xs text-zinc-400">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as FindingTypeEnum)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FINDING_TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs font-mono">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-zinc-400">Severity</Label>
              <Select value={level} onValueChange={(v) => setLevel(v as FindingLevelEnum)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FINDING_LEVEL_OPTIONS.map((lv) => (
                    <SelectItem key={lv} value={lv} className="text-xs">
                      {lv}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-zinc-400">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-xs"
              placeholder="Short title"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-zinc-400">Explanation</Label>
            <Textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={4}
              className="text-xs"
              placeholder="Describe the issue…"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-zinc-400">Recommendation (optional)</Label>
            <Textarea
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-zinc-400">Reference (optional)</Label>
            <Textarea
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={pending}>
            {isCreate ? "Add finding" : "Save changes"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );

  if (isCreate) {
    return (
      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (o) {
            setLocationId("");
            setSelectedScopeIds(new Set());
            setType(FindingTypeEnum.LOGIC);
            setLevel(FindingLevelEnum.MEDIUM);
            setName("");
            setExplanation("");
            setRecommendation("");
            setReference("");
          }
        }}
      >
        <DialogTrigger asChild>{props.trigger}</DialogTrigger>
        {inner}
      </Dialog>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {inner}
    </Dialog>
  );
};
