"use client";

import { io, type Socket } from "socket.io-client";
import { getWsBaseUrl } from "@/lib/api-base";

let socketInstance: Socket | null = null;

export function getRealtimeSocket(): Socket | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (socketInstance) {
    return socketInstance;
  }

  socketInstance = io(getWsBaseUrl(), {
    withCredentials: true,
    transports: ["websocket", "polling"],
  });

  return socketInstance;
}
