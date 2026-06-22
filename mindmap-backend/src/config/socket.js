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
//                            → ChatMessage saved with crisisFlag: true
//
// EVENTS (client → server):
//   "join_room"    { room, anonUsername }
//   "send_message" { room, anonUsername, message }
//   "leave_room"   { room }
//
// EVENTS (server → client):
//   "chat_history"  array of last N ChatMessage docs (on join)
//   "receive_message" { room, anonUsername, message, crisisFlag, createdAt }
//   "crisis_alert"  { message: string }  — sent only to the sender if keyword detected
//   "room_error"    { message: string }  — invalid room or bad payload
//   "user_joined"   { anonUsername, room } — broadcast to room
//   "user_left"     { anonUsername, room } — broadcast to room
// ─────────────────────────────────────────────────────────────────────────────

const { Server }   = require("socket.io");
const ChatMessage  = require("../models/ChatMessage");

const { CHAT_ROOMS, CHAT_HISTORY_LIMIT } = require("../utils/constants");
const { containsCrisisKeyword }          = require("../utils/crisisKeywords");

// ── Module-level io instance (singleton) ─────────────────────────────────────
let io;

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: isValidRoom(room)
// Checks if the room name is one of the allowed CHAT_ROOMS
// ─────────────────────────────────────────────────────────────────────────────
const isValidRoom = (room) => CHAT_ROOMS.includes(room);

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: getRoomHistory(room)
// Fetches the last CHAT_HISTORY_LIMIT messages for a room, oldest → newest
// so the frontend can render them in chronological order
// ─────────────────────────────────────────────────────────────────────────────
const getRoomHistory = async (room) => {
  // Fetch newest N, then reverse so client renders top→bottom
  const messages = await ChatMessage.find({ room })
    .sort({ createdAt: -1 })
    .limit(CHAT_HISTORY_LIMIT)
    .select("anonUsername message crisisFlag createdAt");

  return messages.reverse();
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: initSocket(httpServer)
//
// Called once from server.js after the HTTP server is created.
// Sets up the Socket.io server and all event handlers.
// ─────────────────────────────────────────────────────────────────────────────
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:      process.env.CLIENT_URL,
      methods:     ["GET", "POST"],
      credentials: true,
    },
  });

  // ── Connection handler ────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── EVENT: join_room ───────────────────────────────────────────────────
    // Client sends { room, anonUsername } to join a peer support room.
    // Server:
    //   1. Validates room name against CHAT_ROOMS
    //   2. Joins the socket to that Socket.io room
    //   3. Sends back the last 50 messages (chat history)
    //   4. Broadcasts "user_joined" to everyone else in the room
    // ─────────────────────────────────────────────────────────────────────
    socket.on("join_room", async ({ room, anonUsername }) => {
      // Guard: validate room
      if (!isValidRoom(room)) {
        return socket.emit("room_error", {
          message: `"${room}" is not a valid room. Valid rooms: ${CHAT_ROOMS.join(", ")}`,
        });
      }

      // Guard: anonUsername must be present
      if (!anonUsername || typeof anonUsername !== "string" || !anonUsername.trim()) {
        return socket.emit("room_error", {
          message: "anonUsername is required to join a room.",
        });
      }

      // Join the Socket.io room
      socket.join(room);

      // Store on socket so we can use it in disconnect without the client resending
      socket.data.room         = room;
      socket.data.anonUsername = anonUsername.trim();

      console.log(`👤 ${anonUsername} joined room: ${room}`);

      // Send chat history to the joining user only (not the whole room)
      try {
        const history = await getRoomHistory(room);
        socket.emit("chat_history", history);
      } catch (err) {
        console.error(`[Socket] Failed to load history for room "${room}":`, err.message);
        socket.emit("chat_history", []); // Send empty array — don't crash the join
      }

      // Notify everyone else in the room
      socket.to(room).emit("user_joined", {
        anonUsername: anonUsername.trim(),
        room,
      });
    });

    // ── EVENT: send_message ────────────────────────────────────────────────
    // Client sends { room, anonUsername, message } when user types a message.
    // Server:
    //   1. Validates room + message
    //   2. Scans message with containsCrisisKeyword()
    //   3. Saves to MongoDB (with crisisFlag if keyword found)
    //   4. Broadcasts "receive_message" to the whole room
    //   5. If crisis keyword → also emits "crisis_alert" back to the sender only
    // ─────────────────────────────────────────────────────────────────────
    socket.on("send_message", async ({ room, anonUsername, message }) => {
      // Guard: validate room
      if (!isValidRoom(room)) {
        return socket.emit("room_error", {
          message: `"${room}" is not a valid room.`,
        });
      }

      // Guard: message must be a non-empty string within 1000 chars
      if (!message || typeof message !== "string" || !message.trim()) {
        return socket.emit("room_error", { message: "Message cannot be empty." });
      }

      if (message.trim().length > 1000) {
        return socket.emit("room_error", { message: "Message cannot exceed 1000 characters." });
      }

      const cleanMessage = message.trim();

      // ── Crisis keyword scan ─────────────────────────────────────────────
      const hasCrisis = containsCrisisKeyword(cleanMessage);

      // ── Save to MongoDB ─────────────────────────────────────────────────
      let savedMessage;
      try {
        savedMessage = await ChatMessage.create({
          room,
          anonUsername: anonUsername?.trim() || "Anonymous",
          message:      cleanMessage,
          crisisFlag:   hasCrisis,
        });
      } catch (err) {
        console.error("[Socket] Failed to save message to DB:", err.message);
        return socket.emit("room_error", { message: "Failed to send message. Please try again." });
      }

      // ── Broadcast message to the whole room ─────────────────────────────
      io.to(room).emit("receive_message", {
        anonUsername: savedMessage.anonUsername,
        room:         savedMessage.room,
        message:      savedMessage.message,
        crisisFlag:   savedMessage.crisisFlag,
        createdAt:    savedMessage.createdAt,
      });

      // ── If crisis keyword detected → alert only the sender ──────────────
      if (hasCrisis) {
        console.warn(
          `[Socket] ⚠️  Crisis keyword detected in room "${room}" from "${anonUsername}"`
        );

        socket.emit("crisis_alert", {
          message:
            "We noticed your message may indicate distress. " +
            "You are not alone. Please reach out for support:\n" +
            "• iCall (India): 9152987821\n" +
            "• Vandrevala Foundation: 1860-2662-345 (24/7)\n" +
            "• International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/",
        });
      }
    });

    // ── EVENT: leave_room ──────────────────────────────────────────────────
    // Client explicitly leaves a room (e.g. navigating away from Peer Support page).
    // Server: removes socket from room, notifies others.
    // ─────────────────────────────────────────────────────────────────────
    socket.on("leave_room", ({ room }) => {
      if (!isValidRoom(room)) return;

      const anonUsername = socket.data.anonUsername || "Someone";

      socket.leave(room);

      socket.to(room).emit("user_left", { anonUsername, room });

      console.log(`👤 ${anonUsername} left room: ${room}`);
    });

    // ── EVENT: disconnect ──────────────────────────────────────────────────
    // Fires automatically when the browser tab closes / network drops.
    // If the socket was in a room, notify that room.
    // ─────────────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const { room, anonUsername } = socket.data;

      if (room && anonUsername) {
        socket.to(room).emit("user_left", { anonUsername, room });
        console.log(`🔌 ${anonUsername} disconnected from room: ${room}`);
      } else {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
      }
    });
  });

  console.log("✅ Socket.io initialized");
};

// ─────────────────────────────────────────────────────────────────────────────
// getIO()
// Returns the active Socket.io instance.
// Used by other parts of the app (e.g. future admin alerts) to emit events.
// ─────────────────────────────────────────────────────────────────────────────
const getIO = () => {
  if (!io) throw new Error("[Socket] Socket.io not initialized. Call initSocket() first.");
  return io;
};

module.exports = { initSocket, getIO };
