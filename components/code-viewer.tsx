"use client";

import { ContractVersionSourceI, FunctionScopeI } from "@/utils/types";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { solidity } from "@replit/codemirror-lang-solidity";
import { githubDark } from "@uiw/codemirror-theme-github";
import { basicSetup } from "codemirror";
import React, { useCallback, useEffect, useRef } from "react";

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

  const getSegmentContainer = useCallback((scope: FunctionScopeI): PositionType | null => {
    if (!viewRef.current) {
      return null;
    }
    const view = viewRef.current;
    const startCoords = view.coordsAtPos(scope.src_start_pos);
    const endCoords = view.coordsAtPos(scope.src_end_pos);

    if (!startCoords || !endCoords) {
      return null;
    }

    // Get the scroller for proper coordinate calculation
    const scroller = view.dom.querySelector(".cm-scroller") as HTMLElement;
    if (!scroller) return null;

    const scrollerRect = scroller.getBoundingClientRect();
    const scrollTop = scroller.scrollTop;
    const scrollBottom = scrollTop + scroller.clientHeight;

    // Calculate position relative to the scroller
    const top = startCoords.top - scrollerRect.top + scroller.scrollTop;
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
    (view: EditorView, scope: FunctionScopeI): PositionType | null => {
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

      // Get both scroller and content for coordinate calculation
      const scroller = view.dom.querySelector(".cm-scroller") as HTMLElement;
      const content = view.dom.querySelector(".cm-content") as HTMLElement;
      if (!scroller || !content) return null;

      const scrollerRect = scroller.getBoundingClientRect();

      // Convert viewport coordinates to scroller-relative coordinates
      const scrollerLeft = minLeft - scrollerRect.left;
      const scrollerRight = maxRight - scrollerRect.left;

      // segmentContainer.top is already relative to the scroller, so just subtract padding
      const viewportTop = segmentContainer.top - paddingY;

      return {
        top: Math.max(0, viewportTop),
        height: segmentContainer.height + paddingY * 2,
        left: Math.max(0, scrollerLeft - paddingX),
        width: Math.max(0, scrollerRight - scrollerLeft + paddingX * 2),
      };
    },
    [getSegmentContainer],
  );

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
              const existingOverlay = view.dom.querySelector("#overlay");
              if (existingOverlay) {
                existingOverlay.remove();
              }
              return;
            }

            const allScopes = getAllScopesAtPos(pos);
            if (!allScopes.length) {
              onSelectScope([]);
              const existingOverlay = view.dom.querySelector("#overlay");
              if (existingOverlay) {
                existingOverlay.remove();
              }
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
    if (!viewRef.current || !selectedScope) {
      // Remove existing overlay if any
      const existingOverlay = viewRef.current?.dom.querySelector("#overlay");
      if (existingOverlay) {
        existingOverlay.remove();
      }
      return;
    }

    const view = viewRef.current;

    const segmentContainer = getSegmentContainer(selectedScope);

    if (!segmentContainer) {
      const startLine = view.state.doc.lineAt(selectedScope.src_start_pos);
      const endLine = view.state.doc.lineAt(selectedScope.src_end_pos);

      view.dispatch({
        effects: EditorView.scrollIntoView(
          Math.round(startLine.from + (endLine.to - startLine.from) / 2),
          {
            y: "center",
          },
        ),
      });
    }
    // Wait for the next frame after scroll
    requestAnimationFrame(() => {
      if (!viewRef.current) return;

      // Remove existing overlay from any location
      const existingOverlay = viewRef.current.dom.querySelector("#overlay");
      if (existingOverlay) {
        existingOverlay.remove();
      }

      if (!overlayEnabled) return;

      const rect = getOverlayRect(view, selectedScope);
      if (!rect) return;

      // Create overlay as child of the CodeMirror scroller
      const overlay = document.createElement("div");
      overlay.id = "overlay";
      overlay.style.cssText = `
        position: absolute;
        pointer-events: none;
        background-color: rgba(56, 139, 253, 0.35);
        box-shadow: 0 0 4px rgba(56, 139, 253, 0.8), 0 0 12px rgba(56, 139, 253, 0.5);
        outline: 1px solid rgba(56, 139, 253, 0.8);
        outline-offset: -1px;
        border-radius: 3px;
        transition: all 0.2s ease;
        transform: scale(1.02);
        z-index: 9999;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
      `;

      // Append to the CodeMirror scroller
      const scroller = viewRef.current.dom.querySelector(".cm-scroller") as HTMLElement;
      if (scroller) {
        try {
          scroller.appendChild(overlay);
        } catch (error) {
          console.error("Error appending overlay to scroller:", error);
        }
      }
    });
  }, [selectedScope, getOverlayRect, getSegmentContainer, overlayEnabled]);

  return (
    <>
      <div
        ref={containerRef}
        className="h-full relative overflow-hidden"
        role="region"
        aria-label="Solidity code viewer"
      />
      <style>{`
      .cm-activeLine,.cm-activeLineGutter { background-color: transparent !important; }
      .cm-gutters {background-color: black !important;}
      .cm-gutter {background-color: black !important;}
      .cm-gutterElement {color: #8b949e !important;}
      .cm-editor { height: 100% !important; }
      .cm-scroller { overflow: auto !important; }
      .cm-content { background: black !important; }
      `}</style>
    </>
  );
};

export default SolidityViewer;
