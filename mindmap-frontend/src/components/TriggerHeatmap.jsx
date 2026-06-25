// TriggerHeatmap — shows trigger vs mood score correlation
const SCORE_BUCKET = (score) => {
  if (score <= 3) return "low";
  if (score <= 6) return "mid";
  return "high";
};

const BUCKET_CONFIG = {
  low: { label: "Low (1–3)", color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" },
  mid: { label: "Mid (4–6)", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  high: { label: "High (7–10)", color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.25)" },
};

const TRIGGER_LABELS = {
  poor_sleep: "Poor Sleep",
  work_stress: "Work Stress",
  social_interaction: "Social",
  exercise: "Exercise",
  diet: "Diet",
  loneliness: "Loneliness",
  financial_stress: "Financial",
  relationship: "Relationship",
  health_issue: "Health",
  academic_pressure: "Academic",
};

const TriggerHeatmap = ({ entries = [] }) => {
  // Build trigger → {low, mid, high} count map
  const heatmap = {};
  entries.forEach((entry) => {
    const bucket = SCORE_BUCKET(entry.score);
    entry.triggers?.forEach((trigger) => {
      if (!heatmap[trigger]) heatmap[trigger] = { low: 0, mid: 0, high: 0 };
      heatmap[trigger][bucket]++;
    });
  });

  const triggers = Object.entries(heatmap)
    .sort((a, b) => {
      const totalA = a[1].low + a[1].mid + a[1].high;
      const totalB = b[1].low + b[1].mid + b[1].high;
      return totalB - totalA;
    })
    .slice(0, 8);

  if (triggers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <p className="text-3xl">⚡</p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          No trigger data yet — add triggers when logging mood
        </p>
      </div>
    );
  }

  const Cell = ({ count, bucket }) => {
    if (count === 0) {
      return (
        <div
          className="flex items-center justify-center text-xs rounded-lg h-9 w-12"
          style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
        >
          —
        </div>
      );
    }
    const config = BUCKET_CONFIG[bucket];
    return (
      <div
        className="flex items-center justify-center text-xs font-bold rounded-lg h-9 w-12"
        style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
      >
        {count}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      {/* Legend */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {Object.entries(BUCKET_CONFIG).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ background: config.color }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{config.label}</span>
          </div>
        ))}
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left text-xs font-medium pb-3 pr-4" style={{ color: "var(--text-muted)", width: 130 }}>
              Trigger
            </th>
            <th className="text-center text-xs font-medium pb-3" style={{ color: "#ef4444" }}>Low</th>
            <th className="text-center text-xs font-medium pb-3" style={{ color: "#f59e0b" }}>Mid</th>
            <th className="text-center text-xs font-medium pb-3" style={{ color: "#22c55e" }}>High</th>
          </tr>
        </thead>
        <tbody className="space-y-2">
          {triggers.map(([trigger, counts]) => (
            <tr key={trigger}>
              <td className="py-1.5 pr-4">
                <span className="text-xs font-medium capitalize" style={{ color: "var(--text-secondary)" }}>
                  {TRIGGER_LABELS[trigger] || trigger.replace(/_/g, " ")}
                </span>
              </td>
              <td className="py-1.5 text-center">
                <div className="flex justify-center">
                  <Cell count={counts.low} bucket="low" />
                </div>
              </td>
              <td className="py-1.5 text-center">
                <div className="flex justify-center">
                  <Cell count={counts.mid} bucket="mid" />
                </div>
              </td>
              <td className="py-1.5 text-center">
                <div className="flex justify-center">
                  <Cell count={counts.high} bucket="high" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TriggerHeatmap;
