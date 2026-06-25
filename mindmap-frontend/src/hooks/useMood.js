import { useState, useCallback } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

export const useMood = () => {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);

  // ─── Submit new mood entry ────────────────────────────────────
  const submitMood = useCallback(async (moodData) => {
    setLoading(true);
    try {
      const { data } = await api.post("/mood", moodData);
      return data;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch weekly entries ─────────────────────────────────────
  const fetchWeek = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/mood/week");
      setEntries(data.entries || []);
      return data;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch monthly entries ────────────────────────────────────
  const fetchMonth = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/mood/month");
      setEntries(data.entries || []);
      return data;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch insights ───────────────────────────────────────────
  const fetchInsights = useCallback(async () => {
    try {
      const { data } = await api.get("/mood/insights");
      return data;
    } catch (err) {
      throw err;
    }
  }, []);

  // ─── Delete entry ─────────────────────────────────────────────
  const deleteEntry = useCallback(async (entryId) => {
    try {
      await api.delete(`/mood/${entryId}`);
      setEntries((prev) => prev.filter((e) => e._id !== entryId));
      toast.success("Entry deleted");
    } catch (err) {
      toast.error("Failed to delete entry");
      throw err;
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
