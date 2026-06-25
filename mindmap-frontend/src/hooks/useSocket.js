import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

let socketInstance = null;

export const useSocket = () => {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef(null);

  const connect = useCallback(() => {
    if (socketInstance?.connected) {
      socketRef.current = socketInstance;
      return socketInstance;
    }

    const socket = io("/", {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance = socket;
    socketRef.current = socket;
    return socket;
  }, []);

  const disconnect = useCallback(() => {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      // Don't auto-disconnect — keep connection alive across page navigation
    };
  }, []);

  return {
    socket: socketRef.current,
    connect,
    disconnect,
    isConnected: socketInstance?.connected ?? false,
  };
};

export default useSocket;
