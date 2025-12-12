"use client";

import { formatDate } from "@/utils/helpers";
import { AnalysisDagSchemaI } from "@/utils/types";
import { useEffect, useRef } from "react";
import { Data, Network, Options } from "vis-network";
import "vis-network/styles/vis-network.css";

interface DagViewerProps {
  dag: AnalysisDagSchemaI;
}

const DagViewer: React.FC<DagViewerProps> = ({ dag }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (networkRef.current) {
      networkRef.current.destroy();
      networkRef.current = null;
    }

    const statusConfig: Record<
      string,
      { bg: string; border: string; text: string; label: string }
    > = {
      success: {
        bg: "rgba(34, 197, 94, 0.15)",
        border: "rgba(34, 197, 94, 0.5)",
        text: "rgb(34, 197, 94)",
        label: "Success",
      },
      failed: {
        bg: "rgba(239, 68, 68, 0.15)",
        border: "rgba(239, 68, 68, 0.5)",
        text: "rgb(239, 68, 68)",
        label: "Failed",
      },
      processing: {
        bg: "rgba(59, 130, 246, 0.15)",
        border: "rgba(59, 130, 246, 0.5)",
        text: "rgb(59, 130, 246)",
        label: "Processing",
      },
      waiting: {
        bg: "rgba(234, 179, 8, 0.15)",
        border: "rgba(234, 179, 8, 0.5)",
        text: "rgb(234, 179, 8)",
        label: "Waiting",
      },
      partial: {
        bg: "rgba(249, 115, 22, 0.15)",
        border: "rgba(249, 115, 22, 0.5)",
        text: "rgb(249, 115, 22)",
        label: "Partial",
      },
    };

    const triggerLabels: Record<string, string> = {
      manual_run: "Manual Run",
      chat: "Chat",
      manual_edit: "Manual Edit",
      fork: "Fork",
      merge: "Merge",
    };

    const nodes = dag.nodes.map((node) => {
      const status = "unknown"; // TODO: come back to this, if i want it.
      const config = statusConfig[status] || {
        bg: "rgba(107, 114, 128, 0.15)",
        border: "rgba(107, 114, 128, 0.5)",
        text: "rgb(107, 114, 128)",
        label: status,
      };

      const shortId = node.id.slice(0, 8);
      const triggerLabel = triggerLabels[node.trigger] || node.trigger;
      const findings = node?.n_findings ?? 0;
      const scopes = node?.n_scopes ?? 0;
      const createdDate = formatDate(node.created_at);

      const label = `${node.user.username}\n${triggerLabel} | ${config.label}\nFindings: ${findings} | Scopes: ${scopes}\n${createdDate}\n${shortId}`;

      return {
        id: node.id,
        label,
        shape: "box",
        color: {
          background: config.bg,
          border: config.border,
          highlight: {
            background: config.bg,
            border: config.border,
          },
        },
        font: {
          size: 12,
          color: "rgb(255, 255, 255)",
          face: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        widthConstraint: { minimum: 200, maximum: 250 },
        heightConstraint: { minimum: 120 },
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
      };
    });

    const edges = dag.edges.map((edge) => ({
      from: edge.source,
      to: edge.target,
      arrows: { to: { enabled: true, scaleFactor: 0.25 } },
      smooth: { enabled: true, type: "continuous", roundness: 0.5 },
      color: { color: "rgba(255, 255, 255, 0.3)", highlight: "rgba(255, 255, 255, 0.5)" },
      width: 2,
    }));

    const data: Data = { nodes, edges };

    const options: Options = {
      layout: {
        hierarchical: {
          enabled: true,
          direction: "UD",
          sortMethod: "directed",
          levelSeparation: 200,
          nodeSpacing: 250,
          treeSpacing: 300,
        },
      },
      interaction: {
        dragNodes: false,
        selectConnectedEdges: false,
        zoomView: true,
        dragView: true,
      },
      physics: {
        enabled: false,
      },
      nodes: {
        borderWidth: 2,
        shadow: {
          enabled: true,
          color: "rgba(0, 0, 0, 0.3)",
          size: 10,
          x: 0,
          y: 4,
        },
      },
    };

    const network = new Network(containerRef.current, data, options);
    networkRef.current = network;

    return (): void => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [dag]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default DagViewer;
