"use client";

import { ContractVersionSourceI, FunctionScopeI } from "@/utils/types";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { solidity } from "@replit/codemirror-lang-solidity";
import { githubDark } from "@uiw/codemirror-theme-github";
import { basicSetup } from "codemirror";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface SolidityViewerProps {
  sourceContent: ContractVersionSourceI;
  targets?: FunctionScopeI[];
  selectedScope?: FunctionScopeI | null;
  onSelectScope?: (scopes: FunctionScopeI[]) => void;
  overlayEnabled?: boolean;
}

type PositionType = {
  top: number;
  height: number;
  left: number;
  width: number;
};

const SolidityViewer: React.FC<SolidityViewerProps> = ({
  sourceContent,
  targets = [],
  selectedScope,
  onSelectScope,
  overlayEnabled = false,
}) => {
  /*
  Need to be careful that `targets` is ONLY for functions within the current scope.
  Inherited functions might get mixed up here, be sure to excluded them.
  */

  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [overlayRect, setOverlayRect] = useState<PositionType | null>(null);

  const getSegmentContainer = useCallback((scope: FunctionScopeI): PositionType | null => {
    if (!viewRef.current || !containerRef.current) {
      return null;
    }
    const view = viewRef.current;
    const container = containerRef.current;
    const startCoords = view.coordsAtPos(scope.src_start_pos);
    const endCoords = view.coordsAtPos(scope.src_end_pos);

    if (!startCoords || !endCoords) {
      return null;
    }

    const containerRect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const scrollBottom = scrollTop + containerRect.height;

    const top = startCoords.top - containerRect.top + container.scrollTop;
    const height = endCoords.bottom - startCoords.top;
    const bottom = top + height;

    if (scrollTop > bottom || scrollBottom < top) {
      return null;
    }

    return {
      top,
      height,
      left: 0,
      width: 0,
    };
  }, []);

  const getOverlayRect = useCallback(
    (view: EditorView, scope: FunctionScopeI, container: HTMLDivElement): PositionType | null => {
      const paddingX = 10; // horizontal padding
      const paddingY = 5; // horizontal padding

      const segmentContainer = getSegmentContainer(scope);
      if (!segmentContainer) {
        return null;
      }

      const startLine = view.state.doc.lineAt(scope.src_start_pos);
      const endLine = view.state.doc.lineAt(scope.src_end_pos);
      let minLeft = Infinity;
      let maxRight = -Infinity;

      for (let lineNo = startLine.number; lineNo <= endLine.number; lineNo++) {
        const line = view.state.doc.line(lineNo);
        const from = Math.max(scope.src_start_pos, line.from);
        const to = Math.min(scope.src_end_pos, line.to);

        const startCoords = view.coordsAtPos(from);
        const endCoords = view.coordsAtPos(to);
        if (!startCoords || !endCoords) continue;

        minLeft = Math.min(minLeft, startCoords.left);
        maxRight = Math.max(maxRight, endCoords.right);
      }

      if (minLeft === Infinity || maxRight === -Infinity) return null;

      const containerRect = container.getBoundingClientRect();

      return {
        top: segmentContainer.top - paddingY,
        height: segmentContainer.height + paddingY * 2,
        left: Math.max(0, minLeft - containerRect.left - paddingX),
        width: maxRight - minLeft + paddingX * 2,
      };
    },
    [getSegmentContainer],
  );
  // ... existing code ...

  // Initialize CodeMirror
  useEffect(() => {
    if (!containerRef.current) return;

    // Find all scopes at a given document position (for inherited functions)
    const getAllScopesAtPos = (pos: number): FunctionScopeI[] => {
      return targets.filter((target) => pos >= target.src_start_pos && pos <= target.src_end_pos);
    };

    const state = EditorState.create({
      doc: sourceContent.content,
      extensions: [
        basicSetup,
        solidity,
        EditorState.readOnly.of(true),
        githubDark,
        EditorView.domEventHandlers({
          click: (event, view) => {
            // cannot rely on selectedScope in here.
            if (!onSelectScope || !overlayEnabled) return;

            const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
            if (pos === null) {
              // toggle
              onSelectScope([]);
              setOverlayRect(null);
              return;
            }

            const allScopes = getAllScopesAtPos(pos);
            if (!allScopes.length) {
              onSelectScope([]);
              setOverlayRect(null);
              return;
            }

            // Use the first scope for the overlay (they all have the same position)
            onSelectScope(allScopes);
          },
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return (): void => view.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceContent.content]);

  useEffect(() => {
    if (!viewRef.current || !selectedScope || !containerRef.current) {
      setOverlayRect(null);
      return;
    }
    // I'm mixing up scroll containers, but I need access to the
    // overlay as an absolutely positioned div, WITHIN the scrolling container
    const view = viewRef.current;

    const segmentContainer = getSegmentContainer(selectedScope);

    if (!segmentContainer) {
      const startLine = view.state.doc.lineAt(selectedScope.src_start_pos);
      const endLine = view.state.doc.lineAt(selectedScope.src_end_pos);

      // it seems this struggles with floating point positions, randomly. Round to be safe.
      view.dispatch({
        effects: EditorView.scrollIntoView(
          Math.round(startLine.from + (endLine.to - startLine.from) / 2),
          {
            y: "center",
          },
        ),
      });
    }

    // Wait for CodeMirror layout to update
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const rect = getOverlayRect(view, selectedScope, containerRef.current!);
      setOverlayRect(rect);
    });
  }, [selectedScope, getOverlayRect, getSegmentContainer]);

  return (
    <>
      <div
        ref={containerRef}
        className="h-full relative overflow-auto"
        role="region"
        aria-label="Solidity code viewer"
      >
        {overlayRect && overlayEnabled && (
          <div
            id="overlay"
            style={{
              position: "absolute",
              pointerEvents: "none", // so clicks pass through
              backgroundColor: "rgba(56, 139, 253, 0.35)", // subtle blue fill
              boxShadow: "0 0 4px rgba(56, 139, 253, 0.8), 0 0 12px rgba(56, 139, 253, 0.5)", // glowing border
              outline: "1px solid rgba(56, 139, 253, 0.8)",
              outlineOffset: "-1px",
              borderRadius: "3px",
              transition: "all 0.2s ease",
              transform: "scale(1.02)",
              zIndex: 10,
              ...overlayRect,
            }}
          />
        )}
      </div>
      <style>{`
      .cm-activeLine,.cm-activeLineGutter { background-color: transparent !important; }
      .cm-gutters {background-color: rgb(13, 17, 23) !important;}
      .cm-gutterElement {color: #8b949e !important;}
      `}</style>
    </>
  );
};

export default SolidityViewer;
