/**
 * Debug logging utility for System Health Debug Panel
 * Dispatches custom events that the DebugPanel component listens to
 */

export interface DebugLogEntry {
  type: string;
  message: string;
  extra?: any;
  timestamp: Date;
}

export function debugLog(type: string, message: string, extra?: any): void {
  // Only dispatch if we're in a browser environment
  if (typeof window === "undefined") return;

  const entry: DebugLogEntry = {
    type,
    message,
    extra,
    timestamp: new Date(),
  };

  window.dispatchEvent(
    new CustomEvent("debug-log", {
      detail: entry,
    })
  );
}

