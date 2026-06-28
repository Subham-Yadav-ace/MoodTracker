import { useNavigate } from "react-router-dom";
import { ArrowLeft, Brain } from "lucide-react";
import MoodForm from "../components/MoodForm";

const MoodLog = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto page-enter">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm mb-4 transition-colors hover:text-slate-900"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 gradient-bg"
            style={{ boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}
          >
            <Brain size={22} color="white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              Log Your Mood
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>
              Be honest — the AI understands nuance, not just numbers.
            </p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="card p-6 lg:p-8">
        <MoodForm onSuccess={() => {}} />
      </div>

      {/* Privacy note */}
      <div
        className="mt-4 p-4 rounded-xl flex items-start gap-3"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <span className="text-lg">🔒</span>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Your journal entries are private and never shared. AI sentiment analysis runs on HuggingFace&apos;s servers
          and only the result (emotion label) is stored — not your raw text in ML logs.
        </p>
      </div>
    </div>
  );
};

export default MoodLog;
