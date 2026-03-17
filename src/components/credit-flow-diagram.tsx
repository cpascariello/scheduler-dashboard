"use client";

import { formatAleph } from "@/lib/format";
import type { DistributionSummary } from "@/api/credit-types";

type FlowPath = {
  label: string;
  value: number;
  pct: string;
  color: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
};

const COLORS = {
  storage: "var(--color-info-400)",
  execution: "var(--color-success-500)",
  crn: "var(--color-success-500)",
  ccn: "var(--color-primary-400)",
  staker: "var(--color-warning-400)",
  devFund: "var(--color-muted-foreground)",
};

// SVG layout constants
const W = 900;
const H = 420;
const SRC_X = 20;
const DEST_X = W - 20;
const MID_X = W / 2;
const BOX_W = 140;
const BOX_H = 50;

function bezierPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  const cx = (x1 + x2) / 2;
  return `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
}

function FlowBox({
  x,
  y,
  label,
  value,
  color,
  align = "left",
}: {
  x: number;
  y: number;
  label: string;
  value: string;
  color: string;
  align?: "left" | "right";
}) {
  const rx = align === "right" ? x - BOX_W : x;
  return (
    <g>
      <rect
        x={rx}
        y={y - BOX_H / 2}
        width={BOX_W}
        height={BOX_H}
        rx={8}
        fill="var(--color-surface)"
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={0.4}
      />
      <text
        x={rx + BOX_W / 2}
        y={y - 6}
        textAnchor="middle"
        className="fill-muted-foreground text-[10px] font-semibold uppercase tracking-widest"
      >
        {label}
      </text>
      <text
        x={rx + BOX_W / 2}
        y={y + 14}
        textAnchor="middle"
        className="text-[13px] font-bold tabular-nums"
        fill={color}
      >
        {value}
      </text>
    </g>
  );
}

function AnimatedPath({
  d,
  color,
  thickness,
  label,
  labelX,
  labelY,
}: {
  d: string;
  color: string;
  thickness: number;
  label: string;
  labelX: number;
  labelY: number;
}) {
  const strokeW = Math.max(1.5, Math.min(thickness, 12));
  return (
    <g>
      {/* Background path */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeW}
        strokeOpacity={0.12}
      />
      {/* Animated dashes */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeW}
        strokeOpacity={0.6}
        strokeDasharray="8 12"
        className="flow-path"
      />
      {/* Percentage label */}
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        className="text-[10px] font-semibold tabular-nums"
        fill={color}
        fillOpacity={0.8}
      >
        {label}
      </text>
    </g>
  );
}

type Props = {
  summary: DistributionSummary;
};

export function CreditFlowDiagram({ summary }: Props) {
  const { storageAleph, executionAleph, totalAleph } = summary;
  if (totalAleph === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground/50">
        No credit expenses in this period
      </div>
    );
  }

  // Source positions (left)
  const storY = 100;
  const execY = 320;

  // Destination positions (right)
  const crnY = 70;
  const ccnY = 170;
  const stakerY = 270;
  const devY = 370;

  // Compute amounts
  const storCcn = storageAleph * 0.75;
  const storStaker = storageAleph * 0.2;
  const storDev = storageAleph * 0.05;
  const execCrn = executionAleph * 0.6;
  const execCcn = executionAleph * 0.15;
  const execStaker = executionAleph * 0.2;
  const execDev = executionAleph * 0.05;

  const maxAmount = Math.max(
    storCcn, storStaker, storDev,
    execCrn, execCcn, execStaker, execDev,
  );
  const scale = (v: number) =>
    maxAmount > 0 ? (v / maxAmount) * 10 : 1;

  const srcRight = SRC_X + BOX_W;
  const destLeft = DEST_X - BOX_W;

  // Build paths
  const paths: (FlowPath & { d: string; thickness: number; labelX: number; labelY: number })[] = [];

  if (storageAleph > 0) {
    paths.push({
      label: "75%", value: storCcn, pct: "75%", color: COLORS.ccn,
      from: { x: srcRight, y: storY - 10 }, to: { x: destLeft, y: ccnY },
      d: bezierPath(srcRight, storY - 10, destLeft, ccnY),
      thickness: scale(storCcn), labelX: MID_X - 40, labelY: storY - 25,
    });
    paths.push({
      label: "20%", value: storStaker, pct: "20%", color: COLORS.staker,
      from: { x: srcRight, y: storY + 10 }, to: { x: destLeft, y: stakerY },
      d: bezierPath(srcRight, storY + 10, destLeft, stakerY),
      thickness: scale(storStaker), labelX: MID_X - 80, labelY: storY + 40,
    });
    paths.push({
      label: "5%", value: storDev, pct: "5%", color: COLORS.devFund,
      from: { x: srcRight, y: storY + 20 }, to: { x: destLeft, y: devY },
      d: bezierPath(srcRight, storY + 20, destLeft, devY),
      thickness: scale(storDev), labelX: MID_X - 100, labelY: storY + 80,
    });
  }

  if (executionAleph > 0) {
    paths.push({
      label: "60%", value: execCrn, pct: "60%", color: COLORS.crn,
      from: { x: srcRight, y: execY - 20 }, to: { x: destLeft, y: crnY },
      d: bezierPath(srcRight, execY - 20, destLeft, crnY),
      thickness: scale(execCrn), labelX: MID_X + 40, labelY: execY - 90,
    });
    paths.push({
      label: "15%", value: execCcn, pct: "15%", color: COLORS.ccn,
      from: { x: srcRight, y: execY - 5 }, to: { x: destLeft, y: ccnY },
      d: bezierPath(srcRight, execY - 5, destLeft, ccnY),
      thickness: scale(execCcn), labelX: MID_X + 80, labelY: execY - 40,
    });
    paths.push({
      label: "20%", value: execStaker, pct: "20%", color: COLORS.staker,
      from: { x: srcRight, y: execY + 5 }, to: { x: destLeft, y: stakerY },
      d: bezierPath(srcRight, execY + 5, destLeft, stakerY),
      thickness: scale(execStaker), labelX: MID_X + 60, labelY: execY + 5,
    });
    paths.push({
      label: "5%", value: execDev, pct: "5%", color: COLORS.devFund,
      from: { x: srcRight, y: execY + 20 }, to: { x: destLeft, y: devY },
      d: bezierPath(srcRight, execY + 20, destLeft, devY),
      thickness: scale(execDev), labelX: MID_X + 100, labelY: execY + 45,
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-foreground/[0.06] bg-foreground/[0.02] p-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto w-full max-w-[900px]"
        style={{ minWidth: 600 }}
      >
        {/* Animated paths */}
        {paths.map((p, i) => (
          <AnimatedPath
            key={i}
            d={p.d}
            color={p.color}
            thickness={p.thickness}
            label={p.label}
            labelX={p.labelX}
            labelY={p.labelY}
          />
        ))}

        {/* Source boxes (left) */}
        {storageAleph > 0 && (
          <FlowBox
            x={SRC_X}
            y={storY}
            label="Storage"
            value={formatAleph(storageAleph)}
            color={COLORS.storage}
          />
        )}
        <FlowBox
          x={SRC_X}
          y={execY}
          label="Execution"
          value={formatAleph(executionAleph)}
          color={COLORS.execution}
        />

        {/* Destination boxes (right) */}
        <FlowBox
          x={DEST_X}
          y={crnY}
          label="CRN Nodes"
          value={formatAleph(execCrn)}
          color={COLORS.crn}
          align="right"
        />
        <FlowBox
          x={DEST_X}
          y={ccnY}
          label="CCN Nodes"
          value={formatAleph(storCcn + execCcn)}
          color={COLORS.ccn}
          align="right"
        />
        <FlowBox
          x={DEST_X}
          y={stakerY}
          label="Stakers"
          value={formatAleph(storStaker + execStaker)}
          color={COLORS.staker}
          align="right"
        />
        <FlowBox
          x={DEST_X}
          y={devY}
          label="Dev Fund"
          value={formatAleph(storDev + execDev)}
          color={COLORS.devFund}
          align="right"
        />
      </svg>
    </div>
  );
}
