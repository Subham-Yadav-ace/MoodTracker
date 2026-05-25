const axios = require("axios");

const HF_MODEL_URL =
  "https://router.huggingface.co/hf-inference/models/j-hartmann/emotion-english-distilroberta-base";

// ── Emotion → Sentiment label mapping ────────────────────────
const EMOTION_TO_LABEL = {
  joy:      "POSITIVE",
  surprise: "POSITIVE",
  anger:    "NEGATIVE",
  disgust:  "NEGATIVE",
  fear:     "NEGATIVE",
  sadness:  "NEGATIVE",
  neutral:  "NEUTRAL",
};

// ── Retry helper (cold-start: model loading returns 503) ─────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ────────────────────────────────────────────────────────────
// analyzeSentiment(text)
//
// Calls HuggingFace Inference API and returns:
// {
//   label:         "POSITIVE" | "NEGATIVE" | "NEUTRAL"
//   confidence:    0–1  (top emotion score)
//   emotion:       "joy" | "sadness" | "anger" | "fear" | "disgust" | "surprise" | "neutral"
//   compoundScore: null  (reserved)
// }
//
// Throws an error if the API is down / rate-limited / unreachable
// (caller decides whether to block the mood save — per our design choice)
// ────────────────────────────────────────────────────────────
const analyzeSentiment = async (text, retryCount = 0) => {
  try {
    const response = await axios.post(
      HF_MODEL_URL,
      {
        inputs: text,
        parameters: { top_k: null }, // get all 7 emotion scores, not just the top one
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 15000, // 15s — HuggingFace can be slow on cold start
      }
    );

    // ── Parse response ────────────────────────────────────────
    // HF returns: [ [ {label, score}, {label, score}, ... ] ]
    const scores = response.data[0]; // array of 7 { label, score } objects

    if (!scores || !Array.isArray(scores) || scores.length === 0) {
      throw new Error("Unexpected response format from HuggingFace API");
    }

    // Sort descending by score to find top emotion
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    const top = sorted[0]; // e.g. { label: "joy", score: 0.9772 }

    return {
      label:         EMOTION_TO_LABEL[top.label] || "NEUTRAL",
      confidence:    parseFloat(top.score.toFixed(4)),
      emotion:       top.label,
      compoundScore: null,
    };
  } catch (err) {
    // ── Cold-start: model is loading (503) — retry once after 20s ──
    if (
      retryCount === 0 &&
      err.response?.status === 503 &&
      err.response?.data?.error?.includes("loading")
    ) {
      console.warn("[SentimentService] Model loading — retrying in 20s...");
      await sleep(20000);
      return analyzeSentiment(text, 1);
    }

    // ── Rate limit (429) ─────────────────────────────────────
    if (err.response?.status === 429) {
      const apiErr = new Error("HuggingFace API rate limit reached. Please try again shortly.");
      apiErr.statusCode = 503;
      throw apiErr;
    }

    // ── Timeout ───────────────────────────────────────────────
    if (err.code === "ECONNABORTED") {
      const apiErr = new Error("HuggingFace API request timed out. Please try again.");
      apiErr.statusCode = 503;
      throw apiErr;
    }

    // ── Any other error (network, auth, etc.) ─────────────────
    const apiErr = new Error(
      `Sentiment analysis service is unavailable: ${err.response?.data?.error || err.message}`
    );
    apiErr.statusCode = 503;
    throw apiErr;
  }
};

module.exports = { analyzeSentiment };
