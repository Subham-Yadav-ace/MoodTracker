import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Zap, FileText, Send, X } from "lucide-react";
import { useMood } from "../hooks/useMood";
import DivergenceCard from "./DivergenceCard";
import SentimentBadge from "./SentimentBadge";
import toast from "react-hot-toast";

const EMOTION_TAGS = [
  { id: "happy", label: "Happy", emoji: "😊" },
  { id: "anxious", label: "Anxious", emoji: "😰" },
  { id: "sad", label: "Sad", emoji: "😢" },
  { id: "angry", label: "Angry", emoji: "😠" },
  { id: "calm", label: "Calm", emoji: "😌" },
  { id: "exhausted", label: "Exhausted", emoji: "😴" },
  { id: "hopeful", label: "Hopeful", emoji: "🌟" },
  { id: "overwhelmed", label: "Overwhelmed", emoji: "😵" },
  { id: "lonely", label: "Lonely", emoji: "🥺" },
  { id: "grateful", label: "Grateful", emoji: "🙏" },
  { id: "irritated", label: "Irritated", emoji: "😤" },
  { id: "motivated", label: "Motivated", emoji: "💪" },
];

const TRIGGERS = [
  { id: "poor_sleep", label: "Poor Sleep", emoji: "😴" },
  { id: "work_stress", label: "Work Stress", emoji: "💼" },
  { id: "social_interaction", label: "Social", emoji: "👥" },
  { id: "exercise", label: "Exercise", emoji: "🏃" },
  { id: "diet", label: "Diet", emoji: "🥗" },
  { id: "loneliness", label: "Loneliness", emoji: "🔇" },
  { id: "financial_stress", label: "Financial", emoji: "💸" },
  { id: "relationship", label: "Relationship", emoji: "❤️" },
  { id: "health_issue", label: "Health Issue", emoji: "🏥" },
  { id: "academic_pressure", label: "Academic", emoji: "📚" },
];

// Score color gradient
const getScoreGradient = (score) => {
  if (score >= 8) return "from-emerald-500 to-green-400";
  if (score >= 6) return "from-lime-500 to-yellow-400";
  if (score >= 4) return "from-yellow-500 to-orange-400";
  return "from-orange-500 to-red-500";
};

const getScoreLabel = (score) => {
  if (score >= 9) return "Excellent 🌟";
  if (score >= 7) return "Good 😊";
  if (score >= 5) return "Okay 😐";
  if (score >= 3) return "Low 😔";
  return "Very Low 😢";
};

const MoodForm = ({ onSuccess }) => {
  const { submitMood, loading } = useMood();
  const [score, setScore] = useState(5);
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [selectedTriggers, setSelectedTriggers] = useState([]);
  const [journal, setJournal] = useState("");
  const [result, setResult] = useState(null);

  const toggleEmotion = (id) => {
    setSelectedEmotions((prev) =>
      prev.includes(id)
        ? prev.filter((e) => e !== id)
        : prev.length < 5
        ? [...prev, id]
        : prev
    );
  };

  const toggleTrigger = (id) => {
    setSelectedTriggers((prev) =>
      prev.includes(id)
        ? prev.filter((t) => t !== id)
        : prev.length < 5
        ? [...prev, id]
        : prev
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await submitMood({
        score,
        emotionTags: selectedEmotions,
        triggers: selectedTriggers,
        journalText: journal,
      });
      setResult(data.entry || data);
      toast.success("Mood logged successfully! 🎉");
      onSuccess?.(data.entry || data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to log mood");
    }
  };

  if (result) {
    return (
      <div className="space-y-4 animate-fade-in">
        {/* Success state */}
        <div
          className="p-5 rounded-2xl text-center"
          style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}
        >
          <p className="text-3xl mb-2">✅</p>
          <h3 className="font-semibold text-lg mb-1" style={{ color: "var(--text-primary)" }}>
            Entry saved!
          </h3>
          <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
            Score: <strong>{result.score}/10</strong>
          </p>
          {result.sentiment?.label && (
            <div className="flex justify-center mb-3">
              <SentimentBadge
                label={result.sentiment.label}
                confidence={result.sentiment.confidence}
                emotion={result.sentiment.emotion}
                size="md"
              />
            </div>
          )}
        </div>

        {result.divergenceFlag && (
          <DivergenceCard
            message={result.divergenceMessage || "Your words today sound heavier than your score. That's completely okay."}
            entry={result}
          />
        )}

        <button
          className="btn-secondary w-full"
          onClick={() => {
            setResult(null);
            setScore(5);
            setSelectedEmotions([]);
            setSelectedTriggers([]);
            setJournal("");
          }}
        >
          Log another entry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {/* Score slider */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            How are you feeling today?
          </label>
          <div className="text-right">
            <span
              className={`text-3xl font-bold bg-gradient-to-r ${getScoreGradient(score)} bg-clip-text text-transparent`}
            >
              {score}
            </span>
            <span className="text-sm ml-1" style={{ color: "var(--text-muted)" }}>/10</span>
          </div>
        </div>

        {/* Visual score display */}
        <div
          className="flex items-center justify-center py-4 rounded-2xl mb-4"
          style={{ background: "var(--bg-secondary)" }}
        >
          <span className="text-5xl">{getScoreLabel(score).split(" ")[1]}</span>
          <div className="ml-4">
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {getScoreLabel(score).split(" ")[0]}
            </p>
          </div>
        </div>

        {/* Slider */}
        <div className="relative">
          <input
            id="mood-score-slider"
            type="range"
            min={1}
            max={10}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(score - 1) * 11.11}%, rgba(99,102,241,0.2) ${(score - 1) * 11.11}%)`,
            }}
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>1 — Very Low</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>10 — Excellent</span>
          </div>
        </div>
      </div>

      {/* Emotion tags */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Tag size={15} style={{ color: "var(--brand-from)" }} />
          <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            How would you describe this feeling?
          </label>
          <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
            {selectedEmotions.length}/5
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EMOTION_TAGS.map(({ id, label, emoji }) => (
            <button
              key={id}
              type="button"
              onClick={() => toggleEmotion(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                selectedEmotions.includes(id)
                  ? "gradient-bg text-white shadow-lg"
                  : "hover:border-indigo-500/40"
              }`}
              style={
                selectedEmotions.includes(id)
                  ? { boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }
                  : {
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                    }
              }
              id={`emotion-${id}`}
            >
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Triggers */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={15} style={{ color: "#fbbf24" }} />
          <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            What triggered this? (optional)
          </label>
          <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
            {selectedTriggers.length}/5
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TRIGGERS.map(({ id, label, emoji }) => (
            <button
              key={id}
              type="button"
              onClick={() => toggleTrigger(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                selectedTriggers.includes(id) ? "text-white" : "hover:border-yellow-500/40"
              }`}
              style={
                selectedTriggers.includes(id)
                  ? {
                      background: "linear-gradient(135deg, #f59e0b, #f97316)",
                      boxShadow: "0 4px 12px rgba(245,158,11,0.3)",
                    }
                  : {
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                    }
              }
              id={`trigger-${id}`}
            >
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Journal */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText size={15} style={{ color: "#a78bfa" }} />
          <label htmlFor="mood-journal" className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Journal entry (optional)
          </label>
          <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
            {journal.length}/5000
          </span>
        </div>
        <textarea
          id="mood-journal"
          value={journal}
          onChange={(e) => setJournal(e.target.value.slice(0, 5000))}
          rows={5}
          className="input-base resize-none"
          placeholder="Write about your day, how you're feeling, what's on your mind... Our AI reads this to understand your emotions beyond the score."
        />
        <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
          <span>🧠</span>
          AI analyzes your writing for emotional patterns — completely private.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        id="mood-submit-btn"
        className="btn-primary w-full py-4 text-base"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analyzing your mood...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send size={18} />
            Save Mood Entry
          </span>
        )}
      </button>
    </form>
  );
};

export default MoodForm;
