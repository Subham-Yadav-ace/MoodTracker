import { Lightbulb } from "lucide-react";

const InsightCard = ({ insight, index = 0 }) => {
  if (!insight) return null;

  const colors = [
    { bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)", icon: "#6366f1" },
    { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", icon: "#10b981" },
    { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", icon: "#f59e0b" },
    { bg: "rgba(217,70,239,0.08)", border: "rgba(217,70,239,0.2)", icon: "#d946ef" },
  ];

  const color = colors[index % colors.length];

  return (
    <div
      className="flex gap-4 p-4 rounded-xl animate-fade-in"
      style={{
        background: color.bg,
        border: `1px solid ${color.border}`,
        animationDelay: `${index * 0.1}s`,
      }}
    >
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: `${color.icon}22` }}
      >
        <Lightbulb size={15} style={{ color: color.icon }} />
      </div>
      <div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
          {insight}
        </p>
      </div>
    </div>
  );
};

export default InsightCard;
