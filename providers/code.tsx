"use client";

import { codeActions } from "@/actions/bevor";
import { generateQueryKey } from "@/utils/constants";
import { CodeSourceContentSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
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
  isSticky: boolean;
  handleSourceChange: (sourceId: string, positions?: { start: number; end: number }) => void;
  sourceQuery: {
    data: CodeSourceContentSchemaI | undefined;
    isLoading: boolean;
    error: Error | null;
  };
}

const CodeContext = createContext<CodeContextValue | undefined>(undefined);

export const CodeProvider: React.FC<{
  children: React.ReactNode;
  teamSlug: string;
  codeId: string | null;
  initialSourceId: string | null;
  initialPosition: { start: number; end: number } | undefined;
}> = ({ children, initialSourceId, initialPosition, teamSlug, codeId }) => {
  const [codeVersionId, setCodeVersionId] = useState(codeId);
  const [positions, setPositions] = useState<{ start: number; end: number } | undefined>(
    initialPosition,
  );
  const [htmlLoaded, setHtmlLoaded] = useState(false);
  const [sourceId, setSourceId] = useState<string | null>(initialSourceId);
  const [isSticky, setIsSticky] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null!); // thing that should stick to top (code holder)

  const sourceQuery = useQuery({
    queryKey: generateQueryKey.codeSource(codeVersionId ?? "", sourceId ?? ""),
    queryFn: () => codeActions.getCodeVersionSource(teamSlug, codeVersionId ?? "", sourceId ?? ""),
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

  const sourceQueryValue = useMemo(
    () => ({
      data: sourceQuery.data,
      isLoading: sourceQuery.isLoading,
      error: sourceQuery.error,
    }),
    [sourceQuery.data, sourceQuery.isLoading, sourceQuery.error],
  );

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
      isSticky,
      handleSourceChange,
      codeVersionId,
      setCodeVersionId,
      sourceQuery: sourceQueryValue,
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
      sourceQueryValue,
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
