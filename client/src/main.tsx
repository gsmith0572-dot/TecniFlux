import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global keyboard listener for Debug Panel (Shift+L)
document.addEventListener("keydown", (e) => {
  if (e.shiftKey && e.key.toLowerCase() === "l") {
    window.dispatchEvent(new CustomEvent("toggle-debug"));
  }
});

createRoot(document.getElementById("root")!).render(<App />);
