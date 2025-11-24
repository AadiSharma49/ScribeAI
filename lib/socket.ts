// lib/socket.ts
// Singleton socket.io client wrapper
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = (process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000");
    socket = io(url, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionAttempts: 5,
    });
    socket.on("connect_error", (err) => {
      console.warn("socket connect_error", err);
    });
    socket.on("connect", () => {
      console.log("socket connected", socket?.id);
    });
    socket.on("disconnect", (reason) => {
      console.log("socket disconnected", reason);
    });
  }
  return socket;
}
