import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 shadow-xl"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        minWidth: 160,
      }}
    >
      <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-xs capitalize" style={{ color: "var(--text-secondary)" }}>
            {entry.name}:
          </span>
          <span className="text-sm font-bold" style={{ color: entry.color }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const MoodChart = ({ entries = [], range = "week" }) => {
  const data = entries
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((e) => ({
      date: format(new Date(e.createdAt), range === "week" ? "EEE" : "MMM d"),
      score: e.score,
      divergent: e.divergenceFlag,
      emotion: e.sentiment?.emotion,
      label: e.sentiment?.label,
    }));

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <p className="text-3xl">📊</p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          No data for this period
        </p>
      </div>
    );
  }

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (payload.divergent) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="#f59e0b"
          stroke="#0d1220"
          strokeWidth={2}
        />
      );
    }
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="#6366f1"
        stroke="#0d1220"
        strokeWidth={2}
      />
    );
  };

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(99,102,241,0.1)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: "#475569", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 10]}
          ticks={[2, 4, 6, 8, 10]}
          tick={{ fill: "#475569", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={5} stroke="rgba(99,102,241,0.2)" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="score"
          name="Mood Score"
          stroke="#6366f1"
          strokeWidth={2.5}
          dot={<CustomDot />}
          activeDot={{ r: 7, fill: "#8b5cf6", stroke: "#0d1220", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MoodChart;
