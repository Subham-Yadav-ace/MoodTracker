import { useEffect, useState } from "react";
import { TrendingUp, Tag, Zap, AlertTriangle } from "lucide-react";
import { useMood } from "../hooks/useMood";
import MoodChart from "../components/MoodChart";
import EmotionFrequency from "../components/EmotionFrequency";
import TriggerHeatmap from "../components/TriggerHeatmap";
import InsightCard from "../components/InsightCard";
import LoadingSpinner from "../components/LoadingSpinner";

const TABS = [
  { id: "timeline", label: "Timeline", icon: TrendingUp },
  { id: "emotions", label: "Emotions", icon: Tag },
  { id: "triggers", label: "Triggers", icon: Zap },
  { id: "divergence", label: "Divergence", icon: AlertTriangle },
];

const Analytics = () => {
  const { fetchWeek, fetchMonth, fetchInsights } = useMood();
  const [activeTab, setActiveTab] = useState("timeline");
  const [range, setRange] = useState("week");
  const [entries, setEntries] = useState([]);
  const [insights, setInsights] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const load = async (r) => {
      setPageLoading(true);
      try {
        const [data, ins] = await Promise.all([
          r === "week" ? fetchWeek() : fetchMonth(),
          fetchInsights(),
        ]);
        setEntries(data?.entries || []);
        setInsights(ins);
      } catch {
        setEntries([]);
      } finally {
        setPageLoading(false);
      }
    };
    load(range);
  }, [range, fetchWeek, fetchMonth, fetchInsights]);

  const divergentEntries = entries.filter((e) => e.divergenceFlag);
  const avgScore = entries.length
    ? (entries.reduce((s, e) => s + e.score, 0) / entries.length).toFixed(1)
    : "—";

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            Analytics
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Your mood patterns and emotional insights
          </p>
        </div>

        {/* Range picker */}
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          {["week", "month"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              id={`range-${r}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${
                range === r ? "gradient-bg text-white" : ""
              }`}
              style={
                range !== r
                  ? { color: "var(--text-secondary)" }
                  : {}
              }
            >
              {r === "week" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Entries", value: entries.length, icon: "📝" },
          { label: "Avg Score", value: avgScore ? `${avgScore}/10` : "—", icon: "📊" },
          { label: "Divergences", value: divergentEntries.length, icon: "⚠️" },
          { label: "Streak", value: `${insights?.streak || 0}d`, icon: "🔥" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-2xl mb-1">{icon}</p>
            <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            id={`analytics-tab-${id}`}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
              activeTab === id ? "gradient-bg text-white" : ""
            }`}
            style={
              activeTab !== id
                ? {
                    background: "var(--bg-card)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                  }
                : {}
            }
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {pageLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" message="Loading your data..." />
        </div>
      ) : (
        <div className="card p-6">
          {activeTab === "timeline" && (
            <div>
              <h2 className="text-base font-semibold mb-6" style={{ color: "var(--text-primary)" }}>
                Mood Timeline
              </h2>
              <MoodChart entries={entries} range={range} />
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#6366f1" }} />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Mood score</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#f59e0b" }} />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Divergence detected</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "emotions" && (
            <div>
              <h2 className="text-base font-semibold mb-6" style={{ color: "var(--text-primary)" }}>
                Emotion Frequency
              </h2>
              <EmotionFrequency entries={entries} />
            </div>
          )}

          {activeTab === "triggers" && (
            <div>
              <h2 className="text-base font-semibold mb-6" style={{ color: "var(--text-primary)" }}>
                Trigger vs Mood Heatmap
              </h2>
              <TriggerHeatmap entries={entries} />
            </div>
          )}

          {activeTab === "divergence" && (
            <div>
              <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Divergence Insights
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                Entries where your reported score didn&apos;t match your writing&apos;s emotional tone.
              </p>

              {divergentEntries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">✨</p>
                  <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                    No divergences detected
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Your scores and journal entries align well this period.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {divergentEntries.map((entry) => (
                    <div
                      key={entry._id}
                      className="p-4 rounded-xl"
                      style={{
                        background: "rgba(245,158,11,0.06)",
                        border: "1px solid rgba(245,158,11,0.2)",
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-amber-400 font-bold text-lg">{entry.score}/10</span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        {entry.sentiment?.emotion && (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs capitalize"
                            style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}
                          >
                            {entry.sentiment.emotion} detected
                          </span>
                        )}
                      </div>
                      {entry.journalText && (
                        <p className="text-sm truncate-2 italic" style={{ color: "var(--text-muted)" }}>
                          &quot;{entry.journalText}&quot;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Insights */}
      {insights?.insights?.length > 0 && (
        <div className="mt-6">
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            💡 Personalized Insights
          </h2>
          <div className="space-y-3">
            {insights.insights.map((ins, i) => (
              <InsightCard key={i} insight={ins} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
