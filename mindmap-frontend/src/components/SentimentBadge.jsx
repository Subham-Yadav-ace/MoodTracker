const EMOTION_CONFIG = {
  POSITIVE: { label: "Positive", className: "badge-positive", emoji: "😊" },
  NEGATIVE: { label: "Negative", className: "badge-negative", emoji: "😔" },
  NEUTRAL: { label: "Neutral", className: "badge-neutral", emoji: "😐" },
};

const EMOTION_EMOJI = {
  joy: "😄",
  sadness: "😢",
  anger: "😠",
  fear: "😨",
  disgust: "🤢",
  surprise: "😲",
  neutral: "😐",
};

const SentimentBadge = ({ label, confidence, emotion, size = "sm" }) => {
  if (!label) return null;

  const config = EMOTION_CONFIG[label] || EMOTION_CONFIG.NEUTRAL;
  const emoji = emotion ? (EMOTION_EMOJI[emotion] || config.emoji) : config.emoji;
  const confidencePercent = confidence ? Math.round(confidence * 100) : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.className} ${
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      }`}
    >
      <span>{emoji}</span>
      <span>{config.label}</span>
      {confidencePercent !== null && (
        <span className="opacity-70">{confidencePercent}%</span>
      )}
      {emotion && emotion !== "neutral" && (
        <span className="capitalize opacity-80">· {emotion}</span>
      )}
    </span>
  );
};

export default SentimentBadge;
