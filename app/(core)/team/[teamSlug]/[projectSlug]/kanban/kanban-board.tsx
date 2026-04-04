"use client";

import { analysisActions } from "@/actions/bevor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FindingStatusEnum, KanbanFindingSchema } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Ban,
  CheckCheck,
  CircleDot,
  Filter,
  GripVertical,
  Lock,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType, DragEvent, FC } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const severityOrder = ["critical", "high", "medium", "low"];

const severityBadgeClass: Record<string, string> = {
  critical: "border-0 bg-red-500/10 text-red-400",
  high: "border-0 bg-orange-500/10 text-orange-400",
  medium: "border-0 bg-yellow-500/10 text-yellow-400",
  low: "border-0 bg-blue-500/10 text-blue-400",
};

const formatFindingType = (type: string): string =>
  type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const DRAG_MIME = "application/x-bevor-kanban-finding";

const ALL_CREATORS = "__all__";

type KanbanDragPayload = {
  findingId: string;
  analysisId: string;
  fromStatus: FindingStatusEnum;
};

const KANBAN_COLUMNS: {
  status: FindingStatusEnum;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  {
    status: FindingStatusEnum.INVALIDATED,
    title: "Invalidated",
    description: "Dismissed",
    icon: Ban,
  },
  {
    status: FindingStatusEnum.UNRESOLVED,
    title: "Unresolved",
    description: "Awaiting review",
    icon: CircleDot,
  },
  {
    status: FindingStatusEnum.VALIDATED,
    title: "Validated",
    description: "Confirmed issues",
    icon: ShieldCheck,
  },
  {
    status: FindingStatusEnum.REMEDIATED,
    title: "Remediated",
    description: "Addressed",
    icon: CheckCheck,
  },
];

const serializePayload = (p: KanbanDragPayload): string => JSON.stringify(p);

const readPayload = (e: DragEvent): KanbanDragPayload | null => {
  const raw = e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData("text/plain");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as KanbanDragPayload;
    if (
      parsed.findingId &&
      parsed.analysisId &&
      Object.values(FindingStatusEnum).includes(parsed.fromStatus)
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
};

const KanbanCard: FC<{
  finding: KanbanFindingSchema;
  teamSlug: string;
  projectSlug: string;
  canDrag: boolean;
  isDragging: boolean;
  isUpdating: boolean;
  onCardDragStart: (findingId: string) => void;
  onCardDragEnd: () => void;
}> = ({
  finding,
  teamSlug,
  projectSlug,
  canDrag,
  isDragging,
  isUpdating,
  onCardDragStart,
  onCardDragEnd,
}) => {
  const analysisHref = `/team/${teamSlug}/${projectSlug}/analyses/${finding.analysis_id}?findingId=${encodeURIComponent(finding.id)}`;
  const draggable = canDrag && !isUpdating;

  return (
    <div
      draggable={draggable}
      title={canDrag ? undefined : "Sign in to move findings between columns."}
      onDragStart={(e) => {
        onCardDragStart(finding.id);
        const payload: KanbanDragPayload = {
          findingId: finding.id,
          analysisId: finding.analysis_id,
          fromStatus: finding.status,
        };
        const s = serializePayload(payload);
        e.dataTransfer.setData(DRAG_MIME, s);
        e.dataTransfer.setData("text/plain", s);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={onCardDragEnd}
      className={cn(
        "group rounded-md border border-border/50 bg-muted/20 px-2.5 py-2 shadow-sm transition-[opacity,box-shadow,border-color]",
        draggable && "cursor-grab hover:border-border hover:bg-muted/35 active:cursor-grabbing",
        !canDrag && "cursor-default",
        isDragging && "opacity-45",
        isUpdating && "opacity-65",
      )}
    >
      <div className="flex items-start gap-1.5">
        {canDrag ? (
          <GripVertical
            className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/70 opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        ) : (
          <Lock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/45" aria-hidden />
        )}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start gap-1">
            <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug tracking-tight text-foreground/95 line-clamp-2">
              {finding.name}
            </p>
            <Button
              variant="ghost"
              size="icon-sm"
              className="-mr-1 size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
              asChild
            >
              <Link
                href={analysisHref}
                draggable={false}
                onClick={(ev) => ev.stopPropagation()}
                title="Open in analysis"
                aria-label="Open finding in analysis"
              >
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-1 gap-y-1">
            <Badge
              variant="secondary"
              size="sm"
              className={cn(
                "h-5 px-1.5 text-[10px] font-medium",
                severityBadgeClass[finding.level] ?? "",
              )}
            >
              {finding.level}
            </Badge>
            <span className="text-[11px] text-muted-foreground/90">
              {formatFindingType(finding.type)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border/30 pt-1.5">
            <p className="truncate text-[11px] text-muted-foreground">
              <span className="font-mono text-muted-foreground/80">
                {finding.analysis_id.slice(0, 8)}
              </span>
            </p>
            <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
              <Icon size="xs" seed={finding.user.id} className="shrink-0" />
              <span className="truncate">{finding.user.username}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KanbanColumn: FC<{
  status: FindingStatusEnum;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  findings: KanbanFindingSchema[];
  teamSlug: string;
  projectSlug: string;
  currentUserId: string;
  draggingId: string | null;
  updatingFindingId: string | null;
  isDropTarget: boolean;
  onCardDragStart: (findingId: string) => void;
  onCardDragEnd: () => void;
  onDragOverColumn: (status: FindingStatusEnum) => void;
  onColumnDragLeave: () => void;
  onColumnDrop: (status: FindingStatusEnum, e: DragEvent) => void;
}> = ({
  status,
  title,
  description,
  icon: ColumnIcon,
  findings,
  teamSlug,
  projectSlug,
  currentUserId,
  draggingId,
  updatingFindingId,
  isDropTarget,
  onCardDragStart,
  onCardDragEnd,
  onDragOverColumn,
  onColumnDragLeave,
  onColumnDrop,
}) => (
  <div
    data-kanban-column={status}
    className={cn(
      "flex min-h-[min(72vh,680px)] min-w-[260px] flex-1 flex-col rounded-lg border border-border/40 bg-muted/10 transition-[box-shadow,background-color]",
      isDropTarget && "bg-muted/25 ring-1 ring-inset ring-primary/20",
    )}
    onDragOver={(e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      onDragOverColumn(status);
    }}
    onDragLeave={(e) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        onColumnDragLeave();
      }
    }}
    onDrop={(e) => onColumnDrop(status, e)}
  >
    <div className="sticky top-0 z-1 border-b border-border/35 bg-muted/10 px-3 py-2.5 backdrop-blur-sm">
      <div className="flex min-h-5 items-center gap-1.5">
        <ColumnIcon className="size-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
        <h2 className="text-[13px] font-medium tracking-tight text-foreground/90">{title}</h2>
        <span className="text-[13px] tabular-nums text-muted-foreground">{findings.length}</span>
      </div>
      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground/80">{description}</p>
    </div>
    <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain px-2 py-2">
      {findings.length === 0 ? (
        <p className="px-1 py-8 text-center text-[12px] text-muted-foreground/70">
          Drop cards here to change status
        </p>
      ) : (
        findings.map((finding) => (
          <KanbanCard
            key={finding.id}
            finding={finding}
            teamSlug={teamSlug}
            projectSlug={projectSlug}
            canDrag={!!currentUserId}
            isDragging={draggingId === finding.id}
            isUpdating={updatingFindingId === finding.id}
            onCardDragStart={onCardDragStart}
            onCardDragEnd={onCardDragEnd}
          />
        ))
      )}
    </div>
  </div>
);

const KanbanBoard: FC<{
  findings: KanbanFindingSchema[];
  teamSlug: string;
  projectSlug: string;
  currentUserId: string;
}> = ({ findings: initialFindings, teamSlug, projectSlug, currentUserId }) => {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<KanbanFindingSchema[]>(initialFindings);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<FindingStatusEnum | null>(null);
  const [creatorFilter, setCreatorFilter] = useState<string>("");

  useEffect(() => {
    setItems(initialFindings);
  }, [initialFindings]);

  const creators = useMemo((): KanbanFindingSchema["user"][] => {
    const byId = new Map<string, KanbanFindingSchema["user"]>();
    for (const f of items) byId.set(f.user.id, f.user);
    return Array.from(byId.values()).sort((a, b) => a.username.localeCompare(b.username));
  }, [items]);

  const filteredItems = useMemo(
    () => (creatorFilter ? items.filter((f) => f.user_id === creatorFilter) : items),
    [items, creatorFilter],
  );

  const updateMutation = useMutation({
    mutationFn: ({
      findingId,
      analysisId,
      status,
    }: {
      findingId: string;
      analysisId: string;
      status: FindingStatusEnum;
    }) =>
      analysisActions.updateFinding(teamSlug, analysisId, findingId, { status }).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onMutate: async ({ findingId, status }) => {
      let previous: KanbanFindingSchema[] = [];
      setItems((prev) => {
        previous = prev;
        return prev.map((f) => (f.id === findingId ? { ...f, status } : f));
      });
      return { previous };
    },
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      queryClient.invalidateQueries({
        queryKey: generateQueryKey.validatedFindings(projectSlug),
      });
      toast.success("Finding status updated");
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) setItems(context.previous);
      toast.error("Failed to update finding");
    },
  });

  const byStatus = useMemo(
    () =>
      KANBAN_COLUMNS.reduce(
        (acc, col) => {
          acc[col.status] = filteredItems
            .filter((f) => f.status === col.status)
            .sort((a, b) => severityOrder.indexOf(a.level) - severityOrder.indexOf(b.level));
          return acc;
        },
        {} as Record<FindingStatusEnum, KanbanFindingSchema[]>,
      ),
    [filteredItems],
  );

  const handleColumnDrop = (targetStatus: FindingStatusEnum, e: DragEvent): void => {
    e.preventDefault();
    setDropTargetStatus(null);
    setDraggingId(null);

    const payload = readPayload(e);
    if (!payload) return;
    if (payload.fromStatus === targetStatus) return;
    if (updateMutation.isPending) return;
    if (!currentUserId) return;

    const droppedFinding = items.find((f) => f.id === payload.findingId);
    if (!droppedFinding) return;

    updateMutation.mutate({
      findingId: payload.findingId,
      analysisId: payload.analysisId,
      status: targetStatus,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground/95">Board</h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
            Drag cards between columns to update status. Open a finding from the link control.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
          <label htmlFor="kanban-creator-filter" className="sr-only">
            Filter by creator
          </label>
          <Select
            value={creatorFilter || ALL_CREATORS}
            onValueChange={(v) => setCreatorFilter(v === ALL_CREATORS ? "" : v)}
          >
            <SelectTrigger
              id="kanban-creator-filter"
              className="h-8 w-[min(16rem,100vw-6rem)] text-xs"
            >
              {creatorFilter ? (
                <SelectValue placeholder="Creator">
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon size="xs" seed={creatorFilter} className="shrink-0" />
                    <span className="truncate">
                      {creators.find((u) => u.id === creatorFilter)?.username ?? "Creator"}
                    </span>
                  </span>
                </SelectValue>
              ) : (
                <SelectValue placeholder="All creators" />
              )}
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value={ALL_CREATORS} className="text-xs">
                All creators
              </SelectItem>
              {creators.map((u) => (
                <SelectItem key={u.id} value={u.id} className="text-xs">
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon size="xs" seed={u.id} className="shrink-0" />
                    <span className="truncate">{u.username}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="-mx-0.5 flex flex-col gap-3 overflow-x-auto px-0.5 pb-3 lg:flex-row lg:items-stretch lg:gap-3">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            title={col.title}
            description={col.description}
            icon={col.icon}
            findings={byStatus[col.status] ?? []}
            teamSlug={teamSlug}
            projectSlug={projectSlug}
            currentUserId={currentUserId}
            draggingId={draggingId}
            updatingFindingId={
              updateMutation.isPending && updateMutation.variables
                ? updateMutation.variables.findingId
                : null
            }
            isDropTarget={dropTargetStatus === col.status}
            onCardDragStart={setDraggingId}
            onCardDragEnd={() => {
              setDraggingId(null);
              setDropTargetStatus(null);
            }}
            onDragOverColumn={setDropTargetStatus}
            onColumnDragLeave={() => setDropTargetStatus(null)}
            onColumnDrop={handleColumnDrop}
          />
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;
