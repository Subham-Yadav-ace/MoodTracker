// ─────────────────────────────────────────────────────────────────────────────
// socket.js
//
// Peer Support real-time chat handler for MindMap.
// Attached to the HTTP server in server.js via initSocket(httpServer).
//
// FEATURES:
//   1. Room validation     — only CHAT_ROOMS from constants.js are allowed
//   2. Chat history        — last CHAT_HISTORY_LIMIT (50) messages on join
//   3. Real-time messaging — broadcast to room, saved to MongoDB
//   4. Crisis detection    — every message scanned by containsCrisisKeyword()
//                            → if flagged: emit "crisis_alert" back to sender
//   5. Typing indicators   — "typing" / "stop_typing" events (ephemeral)
//   6. Room user count     — "room_count" emitted to room on join/leave
//
// EVENTS (client → server):
//   "join_room"    { room, anonUsername }
//   "send_message" { room, anonUsername, message }
//   "leave_room"   { room }
//   "typing"       { room }
//   "stop_typing"  { room }
//
// EVENTS (server → client):
//   "chat_history"    array of last N ChatMessage docs (on join)
//   "receive_message" { room, anonUsername, message, crisisFlag, createdAt }
//   "crisis_alert"    { message: string }    — sent only to sender if keyword detected
//   "room_error"      { message: string }    — invalid room or bad payload
//   "user_joined"     { anonUsername, room } — broadcast to room
//   "user_left"       { anonUsername, room } — broadcast to room
//   "room_count"      { count: number }      — broadcast to room on join/leave
//   "user_typing"     { anonUsername }        — broadcast to room (excl. sender)
//   "user_stop_typing" { anonUsername }       — broadcast to room (excl. sender)
// ─────────────────────────────────────────────────────────────────────────────

const { Server }  = require("socket.io");
const ChatMessage = require("../models/ChatMessage");

const { CHAT_ROOMS, CHAT_HISTORY_LIMIT } = require("../utils/constants");
const { containsCrisisKeyword }          = require("../utils/crisisKeywords");

// ── Module-level io singleton ─────────────────────────────────────────────────
let io;

// ── HELPER: isValidRoom ───────────────────────────────────────────────────────
const isValidRoom = (room) => CHAT_ROOMS.includes(room);

// ── HELPER: getRoomHistory ────────────────────────────────────────────────────
const getRoomHistory = async (room) => {
  const messages = await ChatMessage.find({ room })
    .sort({ createdAt: -1 })
    .limit(CHAT_HISTORY_LIMIT)
    .select("anonUsername message crisisFlag createdAt");
  return messages.reverse();
};

// ── HELPER: emitRoomCount ─────────────────────────────────────────────────────
// Sends the current member count for a room to everyone in that room.
const emitRoomCount = (room) => {
  const roomSockets = io.sockets.adapter.rooms.get(room);
  const count = roomSockets ? roomSockets.size : 0;
  io.to(room).emit("room_count", { count });
};

// ── MAIN: initSocket ──────────────────────────────────────────────────────────
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:      process.env.CLIENT_URL,
      methods:     ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── EVENT: join_room ──────────────────────────────────────────────────────
    socket.on("join_room", async ({ room, anonUsername }) => {
      if (!isValidRoom(room)) {
        return socket.emit("room_error", {
          message: `"${room}" is not a valid room. Valid rooms: ${CHAT_ROOMS.join(", ")}`,
        });
      }

      if (!anonUsername || typeof anonUsername !== "string" || !anonUsername.trim()) {
        return socket.emit("room_error", {
          message: "anonUsername is required to join a room.",
        });
      }

      // Leave any previously joined room first (single-room-at-a-time model)
      const prevRoom = socket.data.room;
      if (prevRoom && prevRoom !== room) {
        socket.leave(prevRoom);
        socket.to(prevRoom).emit("user_left", { anonUsername: socket.data.anonUsername || "Someone", room: prevRoom });
        emitRoomCount(prevRoom);
      }

      socket.join(room);
      socket.data.room         = room;
      socket.data.anonUsername = anonUsername.trim();

      console.log(`👤 ${anonUsername} joined room: ${room}`);

      // Send chat history to the joining user only
      try {
        const history = await getRoomHistory(room);
        socket.emit("chat_history", history);
      } catch (err) {
        console.error(`[Socket] Failed to load history for room "${room}":`, err.message);
        socket.emit("chat_history", []);
      }

      // Notify others + broadcast updated count
      socket.to(room).emit("user_joined", { anonUsername: anonUsername.trim(), room });
      emitRoomCount(room);
    });

    // ── EVENT: send_message ───────────────────────────────────────────────────
    socket.on("send_message", async ({ room, anonUsername, message }) => {
      if (!isValidRoom(room)) {
        return socket.emit("room_error", { message: `"${room}" is not a valid room.` });
      }

      if (!message || typeof message !== "string" || !message.trim()) {
        return socket.emit("room_error", { message: "Message cannot be empty." });
      }

      if (message.trim().length > 1000) {
        return socket.emit("room_error", { message: "Message cannot exceed 1000 characters." });
      }

      const cleanMessage  = message.trim();
      const cleanUsername = (anonUsername || socket.data.anonUsername || "Anonymous").trim();
      const hasCrisis     = containsCrisisKeyword(cleanMessage);

      let savedMessage;
      try {
        savedMessage = await ChatMessage.create({
          room,
          anonUsername: cleanUsername,
          message:      cleanMessage,
          crisisFlag:   hasCrisis,
        });
      } catch (err) {
        console.error("[Socket] Failed to save message to DB:", err.message);
        return socket.emit("room_error", { message: "Failed to send message. Please try again." });
      }

      // Broadcast to entire room
      io.to(room).emit("receive_message", {
        anonUsername: savedMessage.anonUsername,
        room:         savedMessage.room,
        message:      savedMessage.message,
        crisisFlag:   savedMessage.crisisFlag,
        createdAt:    savedMessage.createdAt,
      });

      // Crisis alert → sender only
      if (hasCrisis) {
        console.warn(`[Socket] ⚠️  Crisis keyword detected in room "${room}" from "${cleanUsername}"`);
        socket.emit("crisis_alert", {
          message:
            "We noticed your message may indicate distress. You are not alone. Please reach out:\n" +
            "• iCall (India): 9152987821\n" +
            "• Vandrevala Foundation: 1860-2662-345 (24/7)\n" +
            "• AASRA: 91-22-27546669",
          helplines: [
            { name: "iCall",                  number: "9152987821",    desc: "Mon-Sat 8am-10pm" },
            { name: "Vandrevala Foundation",  number: "1860-2662-345", desc: "24/7 helpline" },
            { name: "AASRA",                  number: "91-22-27546669",desc: "24/7 crisis support" },
          ],
        });
      }
    });

    // ── EVENT: leave_room ─────────────────────────────────────────────────────
    socket.on("leave_room", ({ room }) => {
      if (!isValidRoom(room)) return;

      const anonUsername = socket.data.anonUsername || "Someone";
      socket.leave(room);
      socket.to(room).emit("user_left", { anonUsername, room });
      emitRoomCount(room);

      // Clear room from socket data
      if (socket.data.room === room) {
        socket.data.room         = null;
        socket.data.anonUsername = null;
      }

      console.log(`👤 ${anonUsername} left room: ${room}`);
    });

    // ── EVENT: typing ─────────────────────────────────────────────────────────
    socket.on("typing", ({ room }) => {
      if (!room || !isValidRoom(room)) return;
      const anonUsername = socket.data.anonUsername;
      if (anonUsername) {
        socket.to(room).emit("user_typing", { anonUsername });
      }
    });

    // ── EVENT: stop_typing ────────────────────────────────────────────────────
    socket.on("stop_typing", ({ room }) => {
      if (!room || !isValidRoom(room)) return;
      const anonUsername = socket.data.anonUsername;
      if (anonUsername) {
        socket.to(room).emit("user_stop_typing", { anonUsername });
      }
    });

    // ── EVENT: disconnect ─────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const { room, anonUsername } = socket.data;

      if (room && anonUsername) {
        socket.to(room).emit("user_left", { anonUsername, room });
        emitRoomCount(room);
        console.log(`🔌 ${anonUsername} disconnected from room: ${room}`);
      } else {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
      }
    });
  });

  console.log("✅ Socket.io initialized");
};

// ── getIO ─────────────────────────────────────────────────────────────────────
const getIO = () => {
  if (!io) throw new Error("[Socket] Socket.io not initialized. Call initSocket() first.");
  return io;
};

module.exports = { initSocket, getIO };
