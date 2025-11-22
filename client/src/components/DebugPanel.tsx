import { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import type { DebugLogEntry } from "@/utils/debugLog";

const MAX_LOGS = 200;

const TYPE_COLORS: Record<string, string> = {
  LOAD: "#18E0FF", // cyan
  SEARCH: "#2E8BFF", // electric blue
  PDF: "#9B59B6", // purple
  ERROR: "#E74C3C", // red
  AUTH: "#F39C12", // yellow
  DRIVE: "#27AE60", // green
  NETWORK: "#FFFFFF", // white
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] || "#FFFFFF";
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function DebugPanel() {
  const [visible, setVisible] = useState(false);
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);

  // Toggle visibility with Shift+L
  useEffect(() => {
    const handleToggle = () => {
      setVisible((v) => !v);
    };

    window.addEventListener("toggle-debug", handleToggle);
    return () => window.removeEventListener("toggle-debug", handleToggle);
  }, []);

  // Listen for debug log events
  useEffect(() => {
    const handleLog = (e: Event) => {
      const customEvent = e as CustomEvent<DebugLogEntry>;
      setLogs((prev) => {
        const newLogs = [...prev, customEvent.detail];
        // Limit to MAX_LOGS entries
        if (newLogs.length > MAX_LOGS) {
          return newLogs.slice(-MAX_LOGS);
        }
        return newLogs;
      });
    };

    window.addEventListener("debug-log", handleLog as EventListener);
    return () => window.removeEventListener("debug-log", handleLog as EventListener);
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (!visible) return;
    const container = document.getElementById("debug-log-stream");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [logs, visible]);

  const handleClear = () => {
    setLogs([]);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "380px",
        height: "420px",
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        border: "1px solid #18E0FF",
        borderRadius: "8px",
        fontFamily: "monospace",
        fontSize: "12px",
        zIndex: 999999,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 20px rgba(24, 224, 255, 0.3)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #18E0FF",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "rgba(24, 224, 255, 0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#18E0FF", fontWeight: "bold" }}>
            System Health Logger
          </span>
          <span
            style={{
              color: "#18E0FF",
              fontSize: "10px",
              opacity: 0.7,
            }}
          >
            ({logs.length})
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleClear}
            style={{
              background: "transparent",
              border: "1px solid #18E0FF",
              color: "#18E0FF",
              padding: "4px 8px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "10px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            title="Clear logs"
          >
            <Trash2 size={12} />
            Clear
          </button>
          <button
            onClick={() => setVisible(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "#18E0FF",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Log stream */}
      <div
        id="debug-log-stream"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {logs.length === 0 ? (
          <div
            style={{
              color: "#666",
              textAlign: "center",
              padding: "20px",
              fontStyle: "italic",
            }}
          >
            No logs yet. System events will appear here.
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              style={{
                padding: "6px 8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "4px",
                borderLeft: `3px solid ${getTypeColor(log.type)}`,
              }}
            >
              <div style={{ display: "flex", gap: "8px", marginBottom: "2px" }}>
                <span style={{ color: "#888", fontSize: "10px" }}>
                  {formatTime(log.timestamp)}
                </span>
                <span
                  style={{
                    color: getTypeColor(log.type),
                    fontWeight: "bold",
                    fontSize: "10px",
                  }}
                >
                  [{log.type}]
                </span>
              </div>
              <div style={{ color: "#FFFFFF", fontSize: "11px" }}>
                {log.message}
              </div>
              {log.extra && (
                <div
                  style={{
                    color: "#AAA",
                    fontSize: "10px",
                    marginTop: "4px",
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {typeof log.extra === "string"
                    ? log.extra
                    : JSON.stringify(log.extra, null, 2)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

