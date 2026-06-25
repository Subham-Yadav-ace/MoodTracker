import { useEffect, useRef, useState } from "react";
import { Send, Users } from "lucide-react";
import { format } from "date-fns";
import CrisisBanner from "./CrisisBanner";

const ChatRoom = ({ socket, room, anonUsername }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [crisisAlert, setCrisisAlert] = useState(null);
  const [privateSupportMsg, setPrivateSupportMsg] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);
  const [sending, setSending] = useState(false);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !room) return;

    socket.on("room-history", (history) => setMessages(history));

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("user-typing", (user) => {
      if (user !== anonUsername) {
        setTypingUsers((prev) => [...new Set([...prev, user])]);
      }
    });

    socket.on("user-stop-typing", (user) => {
      setTypingUsers((prev) => prev.filter((u) => u !== user));
    });

    socket.on("user-count", ({ count }) => setUserCount(count));

    socket.on("crisis-alert", (data) => setCrisisAlert(data));

    socket.on("private-support", (data) => setPrivateSupportMsg(data));

    return () => {
      socket.off("room-history");
      socket.off("receive-message");
      socket.off("user-typing");
      socket.off("user-stop-typing");
      socket.off("user-count");
      socket.off("crisis-alert");
      socket.off("private-support");
    };
  }, [socket, room, anonUsername]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket || sending) return;

    setSending(true);
    socket.emit("send-message", { room, message: input.trim() });
    setInput("");
    setSending(false);

    // Stop typing
    socket.emit("stop-typing", { room });
    clearTimeout(typingTimer.current);
    setTypingUsers([]);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    socket?.emit("typing", { room });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket?.emit("stop-typing", { room });
    }, 1500);
  };

  const isSelf = (msg) => msg.anonUsername === anonUsername;

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
          <CrisisBanner helplines={crisisAlert.helplines} onDismiss={() => setCrisisAlert(null)} />
        </div>
      )}

      {/* Private support */}
      {privateSupportMsg && (
        <div
          className="mx-4 mt-3 p-4 rounded-xl flex-shrink-0 animate-fade-in"
          style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            💜 {privateSupportMsg.message}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">💬</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Be the first to share. Everyone here is anonymous.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
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
              {format(new Date(msg.createdAt), "h:mm a")}
            </span>
          </div>
        ))}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-end gap-2">
            <div
              className="px-4 py-3 rounded-2xl rounded-bl-sm"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: "var(--text-muted)",
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
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

      {/* Input */}
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
