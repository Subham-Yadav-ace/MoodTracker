import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const EMOTION_COLORS = {
  happy: "#fbbf24",
  anxious: "#a78bfa",
  sad: "#60a5fa",
  angry: "#f87171",
  calm: "#34d399",
  exhausted: "#94a3b8",
  hopeful: "#fb923c",
  overwhelmed: "#e879f9",
  lonely: "#38bdf8",
  grateful: "#4ade80",
  irritated: "#f97316",
  motivated: "#22d3ee",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 shadow-xl"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <p className="text-sm font-semibold capitalize mb-1" style={{ color: "var(--text-primary)" }}>
        {label}
      </p>
      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {payload[0].value} occurrence{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
};

const EmotionFrequency = ({ entries = [] }) => {
  // Count emotion tags
  const freq = {};
  entries.forEach((e) => {
    e.emotionTags?.forEach((tag) => {
      freq[tag] = (freq[tag] || 0) + 1;
    });
  });

  const data = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([emotion, count]) => ({ emotion, count }));

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <p className="text-3xl">🏷️</p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          No emotion tags logged yet
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(99,102,241,0.1)"
          horizontal={true}
          vertical={false}
        />
        <XAxis
          dataKey="emotion"
          tick={{ fill: "#475569", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "#475569", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {data.map(({ emotion }) => (
            <Cell
              key={emotion}
              fill={EMOTION_COLORS[emotion] || "#6366f1"}
              opacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default EmotionFrequency;
