import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import Quest from "./app.jsx";

createRoot(document.getElementById("root")).render(<Quest/>);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
