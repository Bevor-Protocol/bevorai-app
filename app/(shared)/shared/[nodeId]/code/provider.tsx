"use client";

import { sharedActions } from "@/actions/bevor";
import { GraphSnapshotFile, GraphSnapshotNode } from "@/types/api/responses/graph";
import { generateQueryKey } from "@/utils/constants";
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
  fileId: string | null;
  setFileId: React.Dispatch<React.SetStateAction<string | null>>;
  applyHighlight: ({ start, end }: { start: number; end: number }) => void;
  scrollToElement: ({ start, end }: { start: number; end: number }) => void;
  clearHighlight: () => void;
  codeVersionId: string | null;
  setCodeVersionId: React.Dispatch<React.SetStateAction<string | null>>;
  containerRef: React.RefObject<HTMLDivElement>;
  isSticky: boolean;
  handleFileChange: (fileId: string, positions?: { start: number; end: number }) => void;
  fileQuery: UseQueryResult<GraphSnapshotFile, Error>;
  fileContentQuery: UseQueryResult<string, Error>;
  nodesQuery: UseQueryResult<GraphSnapshotNode[], Error>;
}

const CodeContext = createContext<CodeContextValue | undefined>(undefined);

export const CodeProvider: React.FC<{
  children: React.ReactNode;
  nodeId: string;
  codeId: string | null;
  initialFileId: string | null;
  initialPosition?: { start: number; end: number };
}> = ({ children, nodeId, initialFileId, initialPosition, codeId }) => {
  const [codeVersionId, setCodeVersionId] = useState(codeId);
  const [positions, setPositions] = useState<{ start: number; end: number } | undefined>(
    initialPosition,
  );
  const [htmlLoaded, setHtmlLoaded] = useState(false);
  const [fileId, setFileId] = useState<string | null>(initialFileId);
  const [isSticky, setIsSticky] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null!); // thing that should stick to top (code holder)

  const fileQuery = useQuery({
    queryKey: generateQueryKey.codeFile(nodeId, fileId ?? ""),
    queryFn: () =>
      sharedActions.getFile(nodeId, fileId ?? "").then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: !!fileId,
    staleTime: Infinity,
  });

  const fileContentQuery = useQuery({
    queryKey: generateQueryKey.codeFileContent(nodeId, fileId ?? ""),
    queryFn: () =>
      sharedActions.getFileContent(nodeId, fileId ?? "").then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: !!fileId,
    staleTime: Infinity,
  });

  const nodesQuery = useQuery({
    queryKey: generateQueryKey.codeNodes(codeVersionId ?? "", { file_id: fileId! }),
    queryFn: () =>
      sharedActions.getNodes(nodeId, { file_id: fileId! }).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: !!fileId,
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

  const handleFileChange = useCallback(
    (newFileId: string, positions?: { start: number; end: number }): void => {
      setPositions(positions);
      if (newFileId === fileId) return;
      setHtmlLoaded(false);
      setFileId(newFileId);
      if (!positions) {
        if (!containerRef.current) return;
        const codeEl = document.getElementById("code-holder");
        if (!codeEl) return;
        const codeTop = codeEl.getBoundingClientRect().top;
        if (codeTop > 80) return;
        const scrollTop = window.scrollY || window.pageYOffset;
        const targetScroll = scrollTop + codeTop - 80;

        window.scrollTo({
          top: targetScroll,
          behavior: "instant", // optional: smooth scrolling
        });
      }
    },
    [fileId],
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
    if (!containerRef.current) return;
    const containerTop = containerRef.current.getBoundingClientRect().top;

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
            const relativeTop = lineRect.top - containerTop + window.scrollY;
            linePositions.push(relativeTop);
            linesSeen.add(lineNum);
          }
        }
      }
    });

    if (linePositions.length === 0) return;

    const meanPos = linePositions.reduce((sum, pos) => sum + pos, 0) / linePositions.length;
    const scrollPosition = meanPos - window.innerHeight / 2;

    window.scrollTo({
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
      fileId,
      setFileId,
      containerRef,
      isSticky,
      handleFileChange,
      codeVersionId,
      setCodeVersionId,
      fileQuery,
      fileContentQuery,
      nodesQuery,
    }),
    [
      positions,
      htmlLoaded,
      fileId,
      applyHighlight,
      clearHighlight,
      handleFileChange,
      scrollToElement,
      codeVersionId,
      setCodeVersionId,
      isSticky,
      containerRef,
      fileQuery,
      fileContentQuery,
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
