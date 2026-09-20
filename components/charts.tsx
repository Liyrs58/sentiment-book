"use client";

import { useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ReferenceDot,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { INK, RULE } from "@/lib/colors";
import { monthLabel } from "@/lib/format";
import type { EquityPoint } from "@/lib/types";

type TipProps = {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
};

function Tip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-[#C9C2B6] bg-[#FAF7F2] px-2 py-1.5 text-xs">
      <p className="mb-1 text-[#6B7280]">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="tabular" style={{ color: p.color }}>
          {p.name} {p.value.toFixed(2)}
        </p>
      ))}
    </div>
  );
}

export function windowCurve(curve: EquityPoint[], month: string) {
  const cut = curve
    .filter((p) => p.month !== "start" && p.month <= month)
    .slice(-6);
  if (cut.length === 0) return [];
  const base = cut[0];
  return cut.map((p) => ({
    month: p.month,
    label: monthLabel(p.month),
    model: (p.harlf / base.harlf) * 100,
    bench: (p.equal / base.equal) * 100,
  }));
}

function useFrameSize(minH = 220) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: minH });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const apply = () => {
      const w = Math.round(node.getBoundingClientRect().width);
      const h = Math.round(node.getBoundingClientRect().height) || minH;
      if (w > 0) setBox({ w, h });
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(node);
    return () => ro.disconnect();
  }, [minH]);
  return { ref, box };
}

export function EquityPath({
  data,
  showModel,
  showBench,
  onSelectMonth,
}: {
  data: { month: string; label: string; model: number; bench: number }[];
  showModel: boolean;
  showBench: boolean;
  onSelectMonth: (month: string) => void;
}) {
  const { ref, box } = useFrameSize(220);

  if (data.length === 0 || (!showModel && !showBench)) {
    return (
      <div className="flex h-[220px] items-center text-sm text-[#6B7280]">
        No series selected. Use the legend to show the model or equal-weight path.
      </div>
    );
  }
  const last = data[data.length - 1];
  const lows = data.flatMap((d) => [
    ...(showModel ? [d.model] : []),
    ...(showBench ? [d.bench] : []),
  ]);
  const min = Math.min(...lows);
  const max = Math.max(...lows);
  const pad = Math.max(4, (max - min) * 0.18);
  const ready = box.w >= 8;

  return (
    <div
      ref={ref}
      className="relative h-[220px] min-h-[220px] w-full cursor-pointer"
    >
      {ready ? (
        <LineChart
          width={box.w}
          height={box.h}
          data={data}
          margin={{ top: 18, right: 44, left: 4, bottom: 4 }}
          onClick={(state) => {
            const label = state?.activeLabel;
            const point = data.find((d) => d.label === label);
            if (point) onSelectMonth(point.month);
          }}
        >
          <CartesianGrid stroke="#E4DDD2" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#6B7280", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: RULE }}
            interval={0}
          />
          <YAxis
            tick={{ fill: "#6B7280", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            domain={[Math.floor(min - pad), Math.ceil(max + pad)]}
            width={40}
          >
            <Label
              value="index"
              position="insideTopLeft"
              fill="#9A9186"
              fontSize={10}
              offset={-2}
            />
          </YAxis>
          <Tooltip content={<Tip />} />
          {showBench ? (
            <Line
              type="monotone"
              dataKey="bench"
              name="Equal-weight"
              stroke="#9CA3AF"
              strokeWidth={1.4}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 4 }}
            />
          ) : null}
          {showModel ? (
            <Line
              type="monotone"
              dataKey="model"
              name="Model portfolio"
              stroke={INK}
              strokeWidth={1.7}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ) : null}
          {showModel ? (
            <ReferenceDot x={last.label} y={last.model} r={3.5} fill={INK} stroke={INK}>
              <Label
                value={last.model.toFixed(2)}
                position="right"
                fill={INK}
                fontSize={11}
                offset={8}
              />
            </ReferenceDot>
          ) : null}
        </LineChart>
      ) : (
        <div
          className="absolute inset-0 border-b border-[#E4DDD2]"
          aria-hidden
        />
      )}
    </div>
  );
}

export function ytdReturn(curve: EquityPoint[], month: string) {
  const year = month.slice(0, 4);
  const now = curve.find((p) => p.month === month);
  if (!now) return 0;
  const priorDec = curve.find((p) => p.month === `${Number(year) - 1}-12`);
  const jan = curve.find((p) => p.month === `${year}-01`);
  const base = priorDec ?? jan ?? curve[0];
  return now.harlf / base.harlf - 1;
}
