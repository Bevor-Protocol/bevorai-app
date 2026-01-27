"use client";

import { codeActions } from "@/actions/bevor";
import { generateQueryKey } from "@/utils/constants";
import { CodeSourceWithContentSchemaI, NodeSchemaI } from "@/utils/types";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface CodeContextValue {
  positions: { start: number; end: number } | undefined;
  setPositions: React.Dispatch<React.SetStateAction<{ start: number; end: number } | undefined>>;
  htmlLoaded: boolean;
  setHtmlLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  sourceId: string | null;
  setSourceId: React.Dispatch<React.SetStateAction<string | null>>;
  applyHighlight: ({ start, end }: { start: number; end: number }) => void;
  scrollToElement: ({ start, end }: { start: number; end: number }) => void;
  clearHighlight: () => void;
  codeVersionId: string | null;
  setCodeVersionId: React.Dispatch<React.SetStateAction<string | null>>;
  containerRef: React.RefObject<HTMLDivElement>;
  contentViewportRef: React.RefObject<HTMLDivElement>;
  isSticky: boolean;
  handleSourceChange: (sourceId: string, positions?: { start: number; end: number }) => void;
  sourceQuery: UseQueryResult<CodeSourceWithContentSchemaI, Error>;
  nodesQuery: UseQueryResult<NodeSchemaI[], Error>;
}

const CodeContext = createContext<CodeContextValue | undefined>(undefined);

export const CodeProvider: React.FC<{
  children: React.ReactNode;
  teamSlug: string;
  codeId: string | null;
  initialSourceId: string | null;
  initialPosition?: { start: number; end: number };
}> = ({ children, initialSourceId, initialPosition, teamSlug, codeId }) => {
  const [codeVersionId, setCodeVersionId] = useState(codeId);
  const [positions, setPositions] = useState<{ start: number; end: number } | undefined>(
    initialPosition,
  );
  const [htmlLoaded, setHtmlLoaded] = useState(false);
  const [sourceId, setSourceId] = useState<string | null>(initialSourceId);
  const [isSticky, setIsSticky] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null!); // thing that should stick to top (code holder)
  const contentViewportRef = useRef<HTMLDivElement>(null!);

  const sourcesQuery = useQuery({
    queryKey: generateQueryKey.codeSources(codeVersionId ?? ""),
    queryFn: () =>
      codeActions.getSources(teamSlug, codeVersionId ?? "").then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    initialData: undefined, // Let React Query use hydrated data
    staleTime: 5 * 60 * 1000, // Match server config
  });

  useEffect(() => {
    // if someone lands on this while code is processing, the sources aren't available yet.
    // listen to events, and once they're populated, update the source.
    if (!!sourceId || !sourcesQuery.data?.length) return;
    if (sourcesQuery.data) {
      setSourceId(sourcesQuery.data.length ? sourcesQuery.data[0].id : null);
    }
  }, [sourcesQuery.data, sourceId]);

  const sourceQuery = useQuery({
    queryKey: generateQueryKey.codeSource(codeVersionId ?? "", sourceId ?? ""),
    queryFn: () =>
      codeActions.getSource(teamSlug, codeVersionId ?? "", sourceId ?? "").then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: !!sourceId && !!codeVersionId,
    staleTime: Infinity,
  });

  const nodesQuery = useQuery({
    queryKey: generateQueryKey.codeNodes(codeVersionId ?? "", { source_id: sourceId! }),
    queryFn: () =>
      codeActions.getNodes(teamSlug, codeVersionId ?? "", { source_id: sourceId! }).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: !!sourceId && !!codeVersionId,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const sentinelEl = document.getElementById("code-header");
    const codeEl = document.getElementById("code-holder");
    if (!sentinelEl || !codeEl) return;

    const inferSticky = (): void => {
      const sentinelBottom = sentinelEl.getBoundingClientRect().bottom;
      const codeTop = codeEl.getBoundingClientRect().top;
      setIsSticky(codeTop < sentinelBottom);
    };

    window.addEventListener("scroll", inferSticky);

    return (): void => window.removeEventListener("scroll", inferSticky);
  }, [codeVersionId]);

  const handleSourceChange = useCallback(
    (newSourceId: string, positions?: { start: number; end: number }): void => {
      setPositions(positions);
      if (newSourceId === sourceId) return;
      setHtmlLoaded(false);
      setSourceId(newSourceId);
      if (!positions) {
        if (contentViewportRef.current) {
          contentViewportRef.current.scrollTo({
            top: 0,
            behavior: "instant",
          });
        }
      }
    },
    [sourceId],
  );

  const applyHighlight = useCallback(({ start, end }: { start: number; end: number }): void => {
    const elements = document.querySelectorAll("[data-token]");

    elements.forEach((span) => {
      const element = span as HTMLElement;
      const [, start_pos, end_pos] = element.dataset.token!.split(":");
      const overlaps = start <= Number(end_pos) && end >= Number(start_pos);
      if (overlaps) {
        element.classList.remove("dim");
      } else {
        element.classList.add("dim");
      }
    });
  }, []);

  const clearHighlight = useCallback((): void => {
    document.querySelectorAll("[data-token]").forEach((span) => {
      const element = span as HTMLElement;
      element.classList.remove("dim");
    });
    setPositions(undefined);
  }, []);

  const scrollToElement = useCallback(({ start, end }: { start: number; end: number }): void => {
    if (!contentViewportRef.current) return;
    const viewport = contentViewportRef.current;

    const elements = document.querySelectorAll("[data-token]");

    const linesSeen = new Set();
    const linePositions: number[] = [];
    elements.forEach((span) => {
      const element = span as HTMLElement;
      const [, start_pos, end_pos] = element.dataset.token!.split(":");
      const overlaps = start <= Number(end_pos) && end >= Number(start_pos);
      if (overlaps) {
        const lineElement = element.parentElement;
        if (lineElement) {
          const lineNum = lineElement.dataset.line;
          if (!linesSeen.has(lineNum)) {
            const lineRect = lineElement.getBoundingClientRect();
            const viewportRect = viewport.getBoundingClientRect();
            const relativeTop = lineRect.top - viewportRect.top + viewport.scrollTop;
            linePositions.push(relativeTop);
            linesSeen.add(lineNum);
          }
        }
      }
    });

    if (linePositions.length === 0) return;

    let scrollPosition: number;
    const blockTop = Math.min(...linePositions);
    const blockBottom = Math.max(...linePositions);
    const blockHeight = blockBottom - blockTop;
    const viewportHeight = viewport.clientHeight;

    if (blockHeight > viewportHeight - 80) {
      scrollPosition = Math.min(...linePositions) - 40;
    } else {
      scrollPosition = blockTop + blockHeight / 2 - viewportHeight / 2;
    }

    viewport.scrollTo({
      top: Math.max(0, scrollPosition),
      behavior: "smooth",
    });
  }, []);

  const value = useMemo(
    () => ({
      positions,
      setPositions,
      htmlLoaded,
      setHtmlLoaded,
      applyHighlight,
      clearHighlight,
      scrollToElement,
      sourceId,
      setSourceId,
      containerRef,
      contentViewportRef,
      isSticky,
      handleSourceChange,
      codeVersionId,
      setCodeVersionId,
      sourceQuery,
      nodesQuery,
    }),
    [
      positions,
      htmlLoaded,
      sourceId,
      applyHighlight,
      clearHighlight,
      handleSourceChange,
      scrollToElement,
      codeVersionId,
      setCodeVersionId,
      isSticky,
      containerRef,
      contentViewportRef,
      sourceQuery,
      nodesQuery,
    ],
  );

  return <CodeContext.Provider value={value}>{children}</CodeContext.Provider>;
};

export const useCode = (): CodeContextValue => {
  const context = useContext(CodeContext);
  if (context === undefined) {
    throw new Error("useCode must be used within a CodeProvider");
  }
  return context;
};
