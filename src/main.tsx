import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Register service worker with prompt strategy.
// The returned updateSW function is stored globally so PWAUpdateToast can call it.
export const updateSW = registerSW({
  onNeedRefresh() {
    // Dispatch a custom event that PWAUpdateToast listens to
    window.dispatchEvent(new CustomEvent("pwa-update-available"));
  },
  onOfflineReady() {
    console.info("[PWA] App ready to work offline");
  },
  onRegisteredSW(swUrl, registration) {
    // Poll every 60 s so users see the update toast within a minute of a new deploy
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 60_000);
    }
  },
});

createRoot(document.getElementById("root")!).render(<App />);
