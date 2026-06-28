import { useEffect, useRef, useState } from "react";
import { Send, Users } from "lucide-react";
import { format } from "date-fns";
import CrisisBanner from "./CrisisBanner";

const ChatRoom = ({ socket, room, anonUsername }) => {
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState("");
  const [typingUsers, setTypingUsers]     = useState([]);
  const [userCount, setUserCount]         = useState(0);
  const [crisisAlert, setCrisisAlert]     = useState(null);
  const messagesEndRef                    = useRef(null);
  const typingTimer                       = useRef(null);
  const [sending, setSending]             = useState(false);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Socket event listeners ────────────────────────────────────
  useEffect(() => {
    if (!socket || !room) return;

    // Receive chat history on room join
    socket.on("chat_history", (history) => {
      setMessages(history || []);
    });

    // New message broadcast
    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Typing indicators
    socket.on("user_typing", ({ anonUsername: typingUser }) => {
      if (typingUser !== anonUsername) {
        setTypingUsers((prev) => [...new Set([...prev, typingUser])]);
      }
    });

    socket.on("user_stop_typing", ({ anonUsername: typingUser }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== typingUser));
    });

    // Room user count
    socket.on("room_count", ({ count }) => setUserCount(count));

    // User join/leave notifications (optional: could add system messages)
    socket.on("user_joined", ({ anonUsername: who }) => {
      setMessages((prev) => [
        ...prev,
        {
          _id:          `sys-${Date.now()}`,
          anonUsername: "System",
          message:      `${who} joined the room`,
          system:       true,
          createdAt:    new Date().toISOString(),
        },
      ]);
    });

    socket.on("user_left", ({ anonUsername: who }) => {
      // Clear typing indicator if they leave
      setTypingUsers((prev) => prev.filter((u) => u !== who));
      setMessages((prev) => [
        ...prev,
        {
          _id:          `sys-${Date.now()}`,
          anonUsername: "System",
          message:      `${who} left the room`,
          system:       true,
          createdAt:    new Date().toISOString(),
        },
      ]);
    });

    // Crisis alert from server
    socket.on("crisis_alert", (data) => {
      setCrisisAlert(data);
    });

    return () => {
      socket.off("chat_history");
      socket.off("receive_message");
      socket.off("user_typing");
      socket.off("user_stop_typing");
      socket.off("room_count");
      socket.off("user_joined");
      socket.off("user_left");
      socket.off("crisis_alert");
    };
  }, [socket, room, anonUsername]);

  // ── Send message ──────────────────────────────────────────────
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket || sending) return;

    setSending(true);
    socket.emit("send_message", { room, anonUsername, message: input.trim() });
    setInput("");
    setSending(false);

    // Stop typing signal
    socket.emit("stop_typing", { room });
    clearTimeout(typingTimer.current);
    setTypingUsers((prev) => prev.filter((u) => u !== anonUsername));
  };

  // ── Typing indicator ─────────────────────────────────────────
  const handleInputChange = (e) => {
    setInput(e.target.value);
    socket?.emit("typing", { room });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket?.emit("stop_typing", { room });
    }, 1500);
  };

  const isSelf   = (msg) => msg.anonUsername === anonUsername;
  const isSystem = (msg) => msg.system === true;

  return (
    <div className="flex flex-col h-full">
      {/* Room header */}
      <div
        className="px-5 py-3 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <h3 className="font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
            #{room}
          </h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            You are <strong style={{ color: "var(--brand-from)" }}>{anonUsername}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
          <Users size={15} />
          <span className="text-sm">{userCount}</span>
        </div>
      </div>

      {/* Crisis banner */}
      {crisisAlert && (
        <div className="p-3 flex-shrink-0">
          <CrisisBanner
            helplines={crisisAlert.helplines}
            onDismiss={() => setCrisisAlert(null)}
          />
        </div>
      )}

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">💬</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Be the first to share. Everyone here is anonymous.
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          if (isSystem(msg)) {
            return (
              <div key={msg._id || i} className="flex justify-center">
                <span
                  className="text-xs px-3 py-1 rounded-full"
                  style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}
                >
                  {msg.message}
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg._id || i}
              className={`flex flex-col ${isSelf(msg) ? "items-end" : "items-start"}`}
            >
              {!isSelf(msg) && (
                <span className="text-xs mb-1 ml-1" style={{ color: "var(--text-muted)" }}>
                  {msg.anonUsername}
                </span>
              )}
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  isSelf(msg)
                    ? "gradient-bg text-white rounded-br-sm"
                    : "rounded-bl-sm"
                }`}
                style={
                  !isSelf(msg)
                    ? { background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)" }
                    : {}
                }
              >
                {msg.crisisFlag && (
                  <span className="block text-xs text-red-300 mb-1">🚨 Crisis resources below ↓</span>
                )}
                {msg.message}
              </div>
              <span className="text-xs mt-1 mx-1" style={{ color: "var(--text-muted)" }}>
                {msg.createdAt ? format(new Date(msg.createdAt), "h:mm a") : ""}
              </span>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-end gap-2">
            <div
              className="px-4 py-3 rounded-2xl rounded-bl-sm"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: "var(--text-muted)",
                      animation: `bounce 1.2s ease-in-out ${idx * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
            <span className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
              {typingUsers.join(", ")} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={handleInputChange}
            className="input-base flex-1"
            placeholder="Share what's on your mind..."
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            id="chat-send-btn"
            className="btn-primary px-4 flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </form>
        <p className="text-xs mt-2 text-center" style={{ color: "var(--text-muted)" }}>
          You appear as <strong>{anonUsername}</strong> · All messages are anonymous
        </p>
      </div>
    </div>
  );
};

export default ChatRoom;
