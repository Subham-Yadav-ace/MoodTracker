import { TrendingUp, TrendingDown, Minus, Heart, Zap, Target } from "lucide-react";

const WeeklySummary = ({ stats }) => {
  if (!stats) {
    return (
      <div className="card p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 skeleton rounded w-1/3" />
          <div className="h-8 skeleton rounded w-1/2" />
          <div className="h-4 skeleton rounded w-2/3" />
        </div>
      </div>
    );
  }

  const { averageScore, topEmotion, topTrigger, streak, divergenceCount, entryCount } = stats;

  const trend = stats.prevWeekAvg
    ? averageScore > stats.prevWeekAvg
      ? "up"
      : averageScore < stats.prevWeekAvg
      ? "down"
      : "same"
    : null;

  const scoreColor = averageScore >= 7 ? "#22c55e" : averageScore >= 4 ? "#eab308" : "#ef4444";

  return (
    <div className="card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          This Week
        </h3>
        <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
          {entryCount || 0} entries
        </span>
      </div>

      {/* Score */}
      <div className="flex items-end gap-3">
        <span className="text-5xl font-bold leading-none" style={{ color: scoreColor }}>
          {averageScore ? averageScore.toFixed(1) : "—"}
        </span>
        <div className="pb-1">
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>/10 avg</span>
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              {trend === "up" && <TrendingUp size={14} className="text-emerald-400" />}
              {trend === "down" && <TrendingDown size={14} className="text-red-400" />}
              {trend === "same" && <Minus size={14} style={{ color: "var(--text-muted)" }} />}
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                vs last week ({stats.prevWeekAvg?.toFixed(1)})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-3"
          style={{ background: "var(--bg-secondary)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Heart size={13} style={{ color: "#f472b6" }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Top Emotion
            </span>
          </div>
          <p className="text-sm font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
            {topEmotion || "—"}
          </p>
        </div>

        <div
          className="rounded-xl p-3"
          style={{ background: "var(--bg-secondary)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Zap size={13} style={{ color: "#fbbf24" }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Top Trigger
            </span>
          </div>
          <p className="text-sm font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
            {topTrigger ? topTrigger.replace(/_/g, " ") : "—"}
          </p>
        </div>

        <div
          className="rounded-xl p-3"
          style={{ background: "var(--bg-secondary)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Target size={13} style={{ color: "var(--brand-from)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Divergences
            </span>
          </div>
          <p className="text-sm font-semibold" style={{ color: divergenceCount > 0 ? "#f59e0b" : "var(--text-primary)" }}>
            {divergenceCount ?? 0} detected
          </p>
        </div>

        <div
          className="rounded-xl p-3"
          style={{ background: "var(--bg-secondary)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">🔥</span>
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Streak
            </span>
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {streak || 0} day{streak !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeeklySummary;
