"use client";

import { useEffect, useRef, useState } from "react";

export function useWebSocket(onMessage: (data: unknown) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let stopped = false;

    async function getWsUrl(): Promise<string> {
      // Ask the server for the WS URL (set via WS_URL env var)
      try {
        const res = await fetch("/api/ws");
        const { wsUrl } = await res.json();
        if (wsUrl) return wsUrl;
      } catch {}
      // Fallback: same origin
      if (typeof window !== "undefined") {
        const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
        return `${proto}//${window.location.host}`;
      }
      return "ws://localhost:3002";
    }

    async function start() {
      const baseUrl = await getWsUrl();

      function connect() {
        if (stopped) return;
        ws = new WebSocket(`${baseUrl}/ws`);

        ws.onopen = () => setConnected(true);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            onMessageRef.current(data);
          } catch {}
        };

        ws.onclose = () => {
          setConnected(false);
          if (!stopped) reconnectTimer = setTimeout(connect, 3000);
        };

        ws.onerror = () => ws.close();
        wsRef.current = ws;
      }

      connect();
    }

    start();

    return () => {
      stopped = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  return { connected };
}
