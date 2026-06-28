import { useState } from "react";
import { AlertTriangle, Phone, X } from "lucide-react";

const HELPLINES = [
  { name: "iCall", number: "9152987821", desc: "Mon-Sat 8am-10pm" },
  { name: "Vandrevala Foundation", number: "1860-2662-345", desc: "24/7 helpline" },
  { name: "AASRA", number: "91-22-27546669", desc: "24/7 crisis support" },
  { name: "SNEHI", number: "044-24640050", desc: "Mental health helpline" },
];

const CrisisBanner = ({ helplines, onDismiss }) => {
  const [dismissed, setDismissed] = useState(false);
  const lines = helplines || HELPLINES;

  if (dismissed) return null;

  return (
    <div
      className="rounded-2xl p-4 animate-fade-in"
      style={{
        background: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.06))",
        border: "1px solid rgba(239,68,68,0.35)",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(239,68,68,0.2)" }}
          >
            <AlertTriangle size={16} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-400">
              If you&apos;re feeling overwhelmed, please reach out to someone who can help
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              You&apos;re not alone. Our AI detected you might be going through a difficult time.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {lines.map((hl) => (
          <a
            key={hl.number}
            href={`tel:${hl.number}`}
            className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-red-500/10"
            style={{
              background: "rgba(239,68,68,0.05)",
              border: "1px solid rgba(239,68,68,0.15)",
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(239,68,68,0.15)" }}
            >
              <Phone size={13} className="text-red-400" />
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                {hl.name}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {hl.number} · {hl.desc}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default CrisisBanner;
