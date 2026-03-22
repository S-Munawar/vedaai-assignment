import { useEffect, useState } from "react";
import { getRealtimeSocket } from "@/lib/realtime";

type RealtimeStatusType = "connected" | "reconnecting" | "disconnected" | "connecting";

export function useRealtimeStatus(): RealtimeStatusType {
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatusType>("disconnected");

  useEffect(() => {
    const socket = getRealtimeSocket();
    if (!socket) {
      setRealtimeStatus("disconnected");
      return;
    }

    setRealtimeStatus(socket.connected ? "connected" : "connecting");

    const onConnect = () => setRealtimeStatus("connected");
    const onDisconnect = () => setRealtimeStatus("disconnected");
    const onReconnectAttempt = () => setRealtimeStatus("reconnecting");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
    };
  }, []);

  return realtimeStatus;
}
