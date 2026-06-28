import { useState, useCallback } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

export const useMood = () => {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);

  // ─── Submit new mood entry ────────────────────────────────────
  // Backend returns { success, message, data: entry }
  const submitMood = useCallback(async (moodData) => {
    setLoading(true);
    try {
      const { data } = await api.post("/mood", moodData);
      return data; // { success, message, data: entry }
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch weekly entries (last 7 days) ───────────────────────
  // Backend returns { success, entries: [...], stats: { averageScore, topEmotion, ... } }
  const fetchWeek = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/mood/week");
      setEntries(data.entries || []);
      return data; // pass through so callers can use data.entries + data.stats
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch monthly entries (last 30 days) ─────────────────────
  const fetchMonth = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/mood/month");
      setEntries(data.entries || []);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch insights ───────────────────────────────────────────
  // Backend returns flat { success, streak, insights: [...], emotionFrequency: [...], ... }
  const fetchInsights = useCallback(async () => {
    const { data } = await api.get("/mood/insights");
    return data; // flat: data.streak, data.insights, data.emotionFrequency, etc.
  }, []);

  // ─── Delete entry ─────────────────────────────────────────────
  const deleteEntry = useCallback(async (entryId) => {
    try {
      await api.delete(`/mood/${entryId}`);
      setEntries((prev) => prev.filter((e) => e._id !== entryId));
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete entry");
    }
  }, []);

  return {
    loading,
    entries,
    submitMood,
    fetchWeek,
    fetchMonth,
    fetchInsights,
    deleteEntry,
  };
};

export default useMood;
