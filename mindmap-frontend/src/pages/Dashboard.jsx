import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PenLine, BarChart3, Calendar, ArrowRight, Clock, Tag } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { useMood } from "../hooks/useMood";
import WeeklySummary from "../components/WeeklySummary";
import InsightCard from "../components/InsightCard";
import DivergenceCard from "../components/DivergenceCard";
import SentimentBadge from "../components/SentimentBadge";
import StreakCounter from "../components/StreakCounter";
import LoadingSpinner from "../components/LoadingSpinner";

// Score color helper
const getScoreColor = (score) => {
  if (score >= 8) return "#22c55e";
  if (score >= 6) return "#84cc16";
  if (score >= 4) return "#eab308";
  if (score >= 2) return "#f97316";
  return "#ef4444";
};

// Score emoji
const getScoreEmoji = (score) => {
  if (score >= 9) return "🌟";
  if (score >= 7) return "😊";
  if (score >= 5) return "😐";
  if (score >= 3) return "😔";
  return "😢";
};

const Dashboard = () => {
  const { user } = useAuth();
  const { fetchWeek, fetchInsights } = useMood();
  const [weekData, setWeekData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [todayEntry, setTodayEntry] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [week, ins] = await Promise.all([fetchWeek(), fetchInsights()]);
        setWeekData(week);
        setInsights(ins);

        // Find today's entry
        const today = new Date().toDateString();
        const todayEnt = week?.entries?.find(
          (e) => new Date(e.createdAt).toDateString() === today
        );
        setTodayEntry(todayEnt || null);
      } catch {
        // silently fail — will show empty states
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [fetchWeek, fetchInsights]);

  const weekStats = weekData
    ? {
        averageScore: weekData.stats?.averageScore,
        topEmotion: weekData.stats?.topEmotion,
        topTrigger: weekData.stats?.topTrigger,
        streak: insights?.streak || 0,
        divergenceCount: weekData.entries?.filter((e) => e.divergenceFlag).length,
        entryCount: weekData.entries?.length,
        prevWeekAvg: weekData.stats?.prevWeekAvg,
      }
    : null;

  if (pageLoading) {
    return <LoadingSpinner fullPage message="Loading your dashboard..." />;
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const recentEntries = weekData?.entries?.slice(0, 5) || [];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto page-enter">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              {format(new Date(), "EEEE, MMMM d")}
            </p>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              {greeting()},{" "}
              <span className="gradient-text">{user?.name?.split(" ")[0]}</span> 👋
            </h1>
          </div>
          <Link
            to="/log"
            className="btn-primary flex-shrink-0"
            id="dashboard-log-mood-btn"
          >
            <PenLine size={16} />
            Log Today&apos;s Mood
          </Link>
        </div>
      </div>

      {/* Today's mood or CTA */}
      {todayEntry ? (
        <div
          className="card p-6 mb-6 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${getScoreColor(todayEntry.score)}12, transparent)`,
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
              style={{ background: `${getScoreColor(todayEntry.score)}22` }}
            >
              {getScoreEmoji(todayEntry.score)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  Today&apos;s Mood
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}>
                  {format(new Date(todayEntry.createdAt), "h:mm a")}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-4xl font-bold" style={{ color: getScoreColor(todayEntry.score) }}>
                  {todayEntry.score}
                  <span className="text-lg font-normal" style={{ color: "var(--text-muted)" }}>/10</span>
                </span>
                {todayEntry.sentiment?.label && (
                  <SentimentBadge
                    label={todayEntry.sentiment.label}
                    confidence={todayEntry.sentiment.confidence}
                    emotion={todayEntry.sentiment.emotion}
                  />
                )}
              </div>
              {todayEntry.emotionTags?.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {todayEntry.emotionTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded-lg capitalize"
                      style={{ background: "var(--bg-card)", color: "var(--text-secondary)" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Divergence alert */}
          {todayEntry.divergenceFlag && (
            <div className="mt-4">
              <DivergenceCard
                message={todayEntry.divergenceMessage || "Your words today sound heavier than your score. That's completely okay."}
                entry={todayEntry}
              />
            </div>
          )}
        </div>
      ) : (
        <div
          className="card p-8 mb-6 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))",
            border: "1px dashed rgba(99,102,241,0.3)",
          }}
        >
          <p className="text-4xl mb-3">📝</p>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            No entry yet today
          </h3>
          <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
            How are you feeling right now? Take a moment to check in.
          </p>
          <Link to="/log" className="btn-primary mx-auto w-fit" id="dashboard-empty-log-btn">
            <PenLine size={16} />
            Log Mood Now
          </Link>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — weekly summary + streak */}
        <div className="space-y-5">
          <WeeklySummary stats={weekStats} />
          <StreakCounter days={insights?.streak || 0} />

          {/* Quick actions */}
          <div className="card p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider px-1 mb-3" style={{ color: "var(--text-muted)" }}>
              Quick Actions
            </p>
            {[
              { to: "/analytics", icon: BarChart3, label: "View Analytics", desc: "Charts & trends" },
              { to: "/support", icon: Calendar, label: "Peer Support", desc: "Chat anonymously" },
            ].map(({ to, icon: Icon, label, desc }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-white/5"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(99,102,241,0.12)" }}
                >
                  <Icon size={15} style={{ color: "var(--brand-from)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{desc}</p>
                </div>
                <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
              </Link>
            ))}
          </div>
        </div>

        {/* Middle + Right — insights + recent */}
        <div className="lg:col-span-2 space-y-6">
          {/* Insights */}
          <div className="card p-5">
            <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              💡 Insights
            </h2>
            {insights?.insights?.length > 0 ? (
              <div className="space-y-3">
                {insights.insights.slice(0, 3).map((ins, i) => (
                  <InsightCard key={i} insight={ins} index={i} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-3xl mb-3">🔮</p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Log a few more entries to unlock personalized insights
                </p>
              </div>
            )}
          </div>

          {/* Recent entries */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                Recent Entries
              </h2>
              <Link
                to="/analytics"
                className="text-xs font-medium flex items-center gap-1 transition-colors hover:opacity-80"
                style={{ color: "var(--brand-from)" }}
              >
                View all
                <ArrowRight size={12} />
              </Link>
            </div>

            {recentEntries.length > 0 ? (
              <div className="space-y-3">
                {recentEntries.map((entry) => (
                  <div
                    key={entry._id}
                    className="flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-white/5"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: `${getScoreColor(entry.score)}18` }}
                    >
                      {getScoreEmoji(entry.score)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-lg" style={{ color: getScoreColor(entry.score) }}>
                          {entry.score}
                        </span>
                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>/10</span>
                        {entry.sentiment?.label && (
                          <SentimentBadge
                            label={entry.sentiment.label}
                            emotion={entry.sentiment.emotion}
                            size="sm"
                          />
                        )}
                        {entry.divergenceFlag && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}
                          >
                            ⚠ Divergence
                          </span>
                        )}
                      </div>
                      {entry.emotionTags?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          <Tag size={11} style={{ color: "var(--text-muted)" }} className="mt-0.5" />
                          {entry.emotionTags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
                              {tag}{" "}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                      <Clock size={12} />
                      <span className="text-xs">
                        {format(new Date(entry.createdAt), "MMM d")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-3xl mb-3">📭</p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  No entries this week yet
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
