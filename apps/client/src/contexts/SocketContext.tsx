import React, { createContext, useContext, useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    console.log("Initializing socket connection...");

    // Use environment variable or default to Firebase Cloud Functions
    // For local development, set VITE_SOCKET_URL=http://localhost:3001
    // For production, it will use the Firebase Hosting URL
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

    console.log(`Connecting to: ${socketUrl}`);

    const newSocket = io(socketUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000,
      transports: ["websocket", "polling"],
    });

    // Set socket immediately so component can use it
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to server");
      setConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Disconnected from server:", reason);
      setConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setConnected(false);
    });

    newSocket.on("error", (err) => {
      console.error("Socket error:", err);
      setConnected(false);
    });

    // Add connection timeout
    const timeout = setTimeout(() => {
      if (!connected && newSocket) {
        console.log("Connection timeout - forcing reconnect");
        newSocket.disconnect();
        newSocket.connect();
      }
    }, 6000);

    return () => {
      console.log("Cleaning up socket connection");
      clearTimeout(timeout);
      newSocket.removeAllListeners();
      newSocket.close();
    };
  }, []);

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>;
};
