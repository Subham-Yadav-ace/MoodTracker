import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { Users, Shield } from "lucide-react";
import ChatRoom from "../components/ChatRoom";
import CrisisBanner from "../components/CrisisBanner";

const ROOMS = [
  { id: "anxiety",   label: "Anxiety",    emoji: "😰", desc: "Managing worry & anxious thoughts",    color: "#a78bfa" },
  { id: "loneliness",label: "Loneliness", emoji: "🥺", desc: "Connecting when you feel alone",        color: "#60a5fa" },
  { id: "stress",    label: "Stress",     emoji: "😤", desc: "Academic, work & life pressures",       color: "#f97316" },
  { id: "wellness",  label: "Wellness",   emoji: "🌱", desc: "General support & positivity",          color: "#34d399" },
];

// ── Anon username generator ───────────────────────────────────────────────────
// Produces names like "CalmOtter42" — completely local, no server needed.
const ADJECTIVES = [
  "Calm", "Bright", "Gentle", "Brave", "Quiet", "Warm", "Kind", "Soft",
  "Clear", "Swift", "Bold", "Tender", "Serene", "Hopeful", "Steady",
];
const ANIMALS = [
  "Otter", "Fox", "Deer", "Robin", "Crane", "Panda", "Owl", "Finch",
  "Heron", "Lynx", "Dove", "Cub", "Sparrow", "Ibis", "Hawk",
];

const generateAnonUsername = () => {
  const adj    = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num    = Math.floor(Math.random() * 90) + 10; // 10-99
  return `${adj}${animal}${num}`;
};

const PeerSupport = () => {
  const [socket, setSocket]           = useState(null);
  const [activeRoom, setActiveRoom]   = useState(null);
  const [anonUsername]                = useState(() => generateAnonUsername());
  const [connected, setConnected]     = useState(false);

  // ── Create persistent socket connection ──────────────────────
  useEffect(() => {
    const s = io("/", {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    s.on("connect",    () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("room_error", ({ message }) => console.warn("[Socket] Room error:", message));

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // ── Join a chat room ──────────────────────────────────────────
  const joinRoom = useCallback((roomId) => {
    if (!socket || !connected) return;

    // Leave current room first if switching
    if (activeRoom && activeRoom !== roomId) {
      socket.emit("leave_room", { room: activeRoom });
    }

    socket.emit("join_room", { room: roomId, anonUsername });
    setActiveRoom(roomId);
  }, [socket, connected, activeRoom, anonUsername]);

  return (
    <div className="h-screen flex overflow-hidden page-enter" style={{ background: "var(--bg-primary)" }}>
      {/* ── Room selector sidebar ────────────────────────────── */}
      <div
        className="w-64 flex-shrink-0 flex flex-col h-full"
        style={{ background: "var(--bg-secondary)", borderRight: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="p-5 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <h1 className="font-bold text-lg mb-1" style={{ color: "var(--text-primary)" }}>
            Peer Support
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Anonymous support rooms
          </p>

          {/* Connection status */}
          <div className="flex items-center gap-2 mt-3">
            <div
              className={`w-2 h-2 rounded-full transition-colors ${connected ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`}
            />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {connected ? "Connected" : "Connecting..."}
            </span>
          </div>
        </div>

        {/* Rooms list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider px-2 mb-3" style={{ color: "var(--text-muted)" }}>
            Support Rooms
          </p>
          {ROOMS.map(({ id, label, emoji, desc, color }) => (
            <button
              key={id}
              onClick={() => joinRoom(id)}
              id={`room-${id}`}
              disabled={!connected}
              className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                activeRoom === id ? "ring-1" : "hover:bg-white/5"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              style={
                activeRoom === id
                  ? { background: `${color}15`, border: `1px solid ${color}40` }
                  : { border: "1px solid transparent" }
              }
            >
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xl">{emoji}</span>
                <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                  {label}
                </span>
              </div>
              <p className="text-xs ml-8" style={{ color: "var(--text-muted)" }}>{desc}</p>
            </button>
          ))}
        </div>

        {/* Anon identity badge */}
        <div className="p-4 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <Shield size={14} style={{ color: "var(--brand-from)" }} />
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              You are{" "}
              <strong style={{ color: "var(--text-primary)" }}>{anonUsername}</strong>
            </p>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Your real identity is never revealed
          </p>
        </div>
      </div>

      {/* ── Chat area ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {activeRoom && socket ? (
          <ChatRoom socket={socket} room={activeRoom} anonUsername={anonUsername} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center gradient-bg opacity-60 animate-pulse-glow">
              <Users size={36} color="white" />
            </div>
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                Anonymous Peer Support
              </h2>
              <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
                Join a room to connect with others going through similar experiences. Your identity is completely
                anonymous — you&apos;ve been assigned a random name.
              </p>
              <div
                className="p-4 rounded-xl text-left"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
                  🛡️ How anonymity works
                </p>
                <ul className="space-y-1.5">
                  {[
                    `Your name is "${anonUsername}" — randomly generated`,
                    "No one can see your real identity",
                    "Messages auto-delete after 30 days",
                    "Crisis keywords trigger helpline display",
                  ].map((item) => (
                    <li key={item} className="text-xs flex items-start gap-2" style={{ color: "var(--text-secondary)" }}>
                      <span className="mt-0.5">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Static crisis banner always visible on landing screen */}
            <div className="w-full max-w-md">
              <CrisisBanner />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeerSupport;
