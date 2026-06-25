import { AlertTriangle, Heart, X } from "lucide-react";
import { useState } from "react";

const DivergenceCard = ({ message, entry, onDismiss }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !message) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className="relative rounded-2xl p-5 animate-fade-in overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(217,70,239,0.08))",
        border: "1px solid rgba(99,102,241,0.3)",
      }}
    >
      {/* Subtle glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex gap-4">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(99,102,241,0.2)" }}
        >
          <AlertTriangle size={18} style={{ color: "var(--brand-from)" }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              We noticed something
            </h3>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
              style={{ color: "var(--text-muted)" }}
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
            {message}
          </p>

          {/* Mood vs sentiment comparison */}
          {entry && (
            <div className="flex items-center gap-4 mt-3">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                style={{ background: "var(--bg-card)" }}
              >
                <span style={{ color: "var(--text-muted)" }}>You said:</span>
                <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                  {entry.score}/10
                </span>
              </div>
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                style={{ background: "var(--bg-card)" }}
              >
                <span style={{ color: "var(--text-muted)" }}>Detected:</span>
                <span className="font-bold text-red-400 capitalize">
                  {entry.sentiment?.emotion || entry.sentiment?.label?.toLowerCase()}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 mt-3">
            <Heart size={13} style={{ color: "var(--brand-mid)" }} />
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              This is just an observation, not a diagnosis. You know yourself best.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DivergenceCard;
