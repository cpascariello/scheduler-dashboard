import type { NodeStatus } from "@/api/types";

type DotStatus =
  | "healthy"
  | "degraded"
  | "error"
  | "offline"
  | "unknown";

const NODE_STATUS_TO_DOT: Record<NodeStatus, DotStatus> = {
  healthy: "healthy",
  unreachable: "error",
  unknown: "unknown",
  removed: "offline",
};

export function nodeStatusToDot(status: NodeStatus): DotStatus {
  return NODE_STATUS_TO_DOT[status];
}
