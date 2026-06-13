// src/components/charts.jsx
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { useTema } from "../lib/theme.jsx";
import { chartColors } from "../lib/utils.js";

function ChartCard({ title, unit, children, height = 150 }) {
  return (
    <div className="card" style={{ padding: "18px 18px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>{title}</span>
        {unit && <span style={{ fontSize: 12, color: "var(--inkFaint)" }}>{unit}</span>}
      </div>
      <ResponsiveContainer width="100%" height={height}>{children}</ResponsiveContainer>
    </div>
  );
}

export function LinhaChart({ data, dataKey, color, title, unit, height }) {
  const { tema } = useTema();
  const c = chartColors(tema);
  const cor = color || c.brand;
  return (
    <ChartCard title={title} unit={unit} height={height || 130}>
      <LineChart data={data} margin={{ top: 4, right: 6, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={c.line} vertical={false} />
        <XAxis dataKey="x" tick={{ fontSize: 10.5, fill: c.inkFaint }} axisLine={false} tickLine={false} />
        <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10.5, fill: c.inkFaint }} axisLine={false} tickLine={false} width={36} />
        <Tooltip contentStyle={{ background: c.ink === "#e8eeec" ? "#19211f" : "#fff", border: `1px solid ${c.line}`, borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: c.inkSoft, fontWeight: 600 }} itemStyle={{ color: cor }} />
        <Line type="monotone" dataKey={dataKey} stroke={cor} strokeWidth={2.5}
          dot={{ r: 3, fill: cor, strokeWidth: 0 }} activeDot={{ r: 5, fill: cor }} />
      </LineChart>
    </ChartCard>
  );
}

export function BarraChart({ data, dataKey, colorKey, title, unit, height, intY }) {
  const { tema } = useTema();
  const c = chartColors(tema);
  const cor = c[colorKey] || c.brand;
  return (
    <ChartCard title={title} unit={unit} height={height || 200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={c.line} vertical={false} />
        <XAxis dataKey="x" tick={{ fontSize: 11, fill: c.inkFaint }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={!intY} tick={{ fontSize: 11, fill: c.inkFaint }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: c.ink === "#e8eeec" ? "#19211f" : "#fff", border: `1px solid ${c.line}`, borderRadius: 8, fontSize: 12 }}
          cursor={{ fill: c.line, opacity: 0.3 }} />
        <Bar dataKey={dataKey} radius={[5, 5, 0, 0]} maxBarSize={44}>
          {data.map((_, i) => <Cell key={i} fill={cor} />)}
        </Bar>
      </BarChart>
    </ChartCard>
  );
}
