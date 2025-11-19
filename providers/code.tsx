"use client";

import { codeActions } from "@/actions/bevor";
import { generateQueryKey } from "@/utils/constants";
import { CodeSourceContentSchemaI } from "@/utils/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
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
  scrollRef: React.RefObject<HTMLDivElement>;
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
}> = ({ children, initialSourceId, teamSlug, codeId }) => {
  const [codeVersionId, setCodeVersionId] = useState(codeId);
  const [positions, setPositions] = useState<{ start: number; end: number } | undefined>(undefined);
  const [htmlLoaded, setHtmlLoaded] = useState(true);
  const [sourceId, setSourceId] = useState<string | null>(initialSourceId);
  const [isSticky, setIsSticky] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null!); // scrollArea
  const containerRef = useRef<HTMLDivElement>(null!); // thing that should stick to top (code holder)

  const sourceQuery = useQuery({
    queryKey: generateQueryKey.codeSource(codeVersionId ?? "", sourceId ?? ""),
    queryFn: () => codeActions.getCodeVersionSource(teamSlug, codeVersionId ?? "", sourceId ?? ""),
    enabled: !!sourceId && !!codeVersionId,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!scrollRef.current || !containerRef.current) return;

    const scrollElement = scrollRef.current;
    const fullHolder = scrollElement.firstChild;
    if (!fullHolder) return;

    const updateStickyState = (): void => {
      const toTop = (fullHolder as HTMLElement).clientHeight - containerRef.current.clientHeight;
      setIsSticky(scrollElement.scrollTop >= toTop);
    };

    updateStickyState();

    scrollRef.current.addEventListener("scroll", updateStickyState);

    return (): void => {
      scrollElement.removeEventListener("scroll", updateStickyState);
    };
  }, [codeVersionId]);

  const handleSourceChange = useCallback(
    (newSourceId: string, positions?: { start: number; end: number }): void => {
      setPositions(positions);
      if (newSourceId === sourceId) return;
      setHtmlLoaded(false);
      setSourceId(newSourceId);
      if (!positions) {
        if (!scrollRef.current || !containerRef.current) return;

        const fullHolder = scrollRef.current.firstChild;
        if (!fullHolder) return;

        const toTop = (fullHolder as HTMLElement).clientHeight - containerRef.current.clientHeight;
        if (scrollRef.current.scrollTop > toTop) {
          scrollRef.current.scrollTop = toTop;
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
    if (!scrollRef.current || !containerRef.current) return;
    const fullHolder = scrollRef.current.firstChild;
    if (!fullHolder) return;

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
            const scrollRect = scrollRef.current!.getBoundingClientRect();
            const relativeTop = lineRect.top - scrollRect.top + scrollRef.current!.scrollTop;
            linePositions.push(relativeTop);
            linesSeen.add(lineNum);
          }
        }
      }
    });

    if (linePositions.length === 0) return;

    const meanPos = linePositions.reduce((sum, pos) => sum + pos, 0) / linePositions.length;
    const scrollContainerHeight = scrollRef.current.clientHeight;
    const scrollPosition = meanPos - scrollContainerHeight / 2;

    scrollRef.current.scrollTo({
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
      scrollRef,
      containerRef,
      isSticky,
      handleSourceChange,
      codeVersionId,
      setCodeVersionId,
      sourceQuery: {
        data: sourceQuery.data,
        isLoading: sourceQuery.isLoading,
        error: sourceQuery.error,
      },
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
      scrollRef,
      containerRef,
      sourceQuery.data,
      sourceQuery.isLoading,
      sourceQuery.error,
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
