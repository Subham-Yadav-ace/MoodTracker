import { Flame } from "lucide-react";

const StreakCounter = ({ days = 0 }) => {
  if (days === 0) {
    return (
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
        }}
      >
        <Flame size={16} />
        <span>Start your streak today</span>
      </div>
    );
  }

  const isHot = days >= 7;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        background: isHot
          ? "linear-gradient(135deg, rgba(251,191,36,0.12), rgba(249,115,22,0.08))"
          : "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))",
        border: `1px solid ${isHot ? "rgba(251,191,36,0.3)" : "rgba(99,102,241,0.2)"}`,
      }}
    >
      <div
        className="flex items-center justify-center w-9 h-9 rounded-lg"
        style={{
          background: isHot ? "rgba(251,191,36,0.15)" : "rgba(99,102,241,0.15)",
        }}
      >
        <Flame
          size={18}
          style={{ color: isHot ? "#fbbf24" : "var(--brand-from)" }}
          className={isHot ? "animate-float" : ""}
        />
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span
            className="text-2xl font-bold leading-none"
            style={{ color: isHot ? "#fbbf24" : "var(--text-primary)" }}
          >
            {days}
          </span>
          <span className="text-sm font-medium" style={{ color: isHot ? "#f97316" : "var(--text-secondary)" }}>
            day{days !== 1 ? "s" : ""}
          </span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {isHot ? "🔥 On fire! Keep going!" : "Current streak"}
        </p>
      </div>
    </div>
  );
};

export default StreakCounter;
