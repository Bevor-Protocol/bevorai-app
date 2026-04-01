"use client";

import { analysisActions } from "@/actions/bevor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FindingSchema, FindingStatusEnum } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Ban,
  CheckCheck,
  CircleDot,
  GripVertical,
  Lock,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType, DragEvent, FC } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const severityOrder = ["critical", "high", "medium", "low"];

const severityBadgeClass: Record<string, string> = {
  critical: "border-0 bg-red-500/10 text-red-600 dark:text-red-400",
  high: "border-0 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  medium: "border-0 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  low: "border-0 bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

const formatFindingType = (type: string): string =>
  type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const DRAG_MIME = "application/x-bevor-kanban-finding";

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
  finding: FindingSchema;
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
      title={
        canDrag
          ? undefined
          : "Only the teammate this finding belongs to can move it between columns."
      }
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
        "rounded-lg bg-background/90 p-3 shadow-sm transition-[opacity,box-shadow,background-color]",
        draggable && "cursor-grab hover:bg-muted/70 active:cursor-grabbing",
        !canDrag && "cursor-default",
        isDragging && "opacity-50",
        isUpdating && "opacity-70",
      )}
    >
      <div className="flex items-start gap-2">
        {canDrag ? (
          <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground/60" aria-hidden />
        )}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start gap-1">
            <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground line-clamp-2">
              {finding.name}
            </p>
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link
                href={analysisHref}
                draggable={false}
                onClick={(ev) => ev.stopPropagation()}
                title="Open analysis"
                aria-label="Open finding in analysis"
              >
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="secondary"
              size="sm"
              className={severityBadgeClass[finding.level] ?? ""}
            >
              {finding.level}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatFindingType(finding.type)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Analysis <span className="font-mono">{finding.analysis_id.slice(0, 8)}</span>
          </p>
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
  findings: FindingSchema[];
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
  icon: Icon,
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
      "flex min-h-[min(70vh,640px)] min-w-[272px] flex-1 flex-col rounded-xl bg-muted/25 transition-[box-shadow,background-color]",
      isDropTarget && "bg-primary/6 ring-1 ring-inset ring-primary/25",
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
    <div className="px-3 pb-2 pt-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <h2 className="text-sm font-semibold">{title}</h2>
        <Badge variant="secondary" size="sm" className="ml-auto tabular-nums">
          {findings.length}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
    <div className="flex flex-col gap-2 overflow-y-auto p-2">
      {findings.length === 0 ? (
        <p className="px-2 py-6 text-center text-xs text-muted-foreground">
          No findings — drop here to change status
        </p>
      ) : (
        findings.map((finding) => (
          <KanbanCard
            key={finding.id}
            finding={finding}
            teamSlug={teamSlug}
            projectSlug={projectSlug}
            canDrag={!!currentUserId && finding.user_id === currentUserId}
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
  findings: FindingSchema[];
  teamSlug: string;
  projectSlug: string;
  currentUserId: string;
}> = ({ findings: initialFindings, teamSlug, projectSlug, currentUserId }) => {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<FindingSchema[]>(initialFindings);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<FindingStatusEnum | null>(null);

  useEffect(() => {
    setItems(initialFindings);
  }, [initialFindings]);

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
      let previous: FindingSchema[] = [];
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

  const byStatus = KANBAN_COLUMNS.reduce(
    (acc, col) => {
      acc[col.status] = items
        .filter((f) => f.status === col.status)
        .sort((a, b) => severityOrder.indexOf(a.level) - severityOrder.indexOf(b.level));
      return acc;
    },
    {} as Record<FindingStatusEnum, FindingSchema[]>,
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
    if (!droppedFinding || droppedFinding.user_id !== currentUserId) return;

    updateMutation.mutate({
      findingId: payload.findingId,
      analysisId: payload.analysisId,
      status: targetStatus,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Findings board</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Drag your cards between columns to update status (assigned teammate only). The corner
          control opens the analysis with that finding selected.
        </p>
      </div>
      <div className="-mx-1 flex flex-col gap-4 overflow-x-auto px-1 pb-2 lg:flex-row lg:items-stretch">
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
