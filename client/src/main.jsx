import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";

// --- Force DaisyUI / Tailwind to stay in light mode ---
document.documentElement.setAttribute("data-theme", "meditrack"); // use your light theme
document.documentElement.classList.remove("dark");                 // remove accidental dark class
document.documentElement.style.colorScheme = "light";              // keep form controls light
// -------------------------------------------------------

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId="389432776360-6eqojkuaos6c8uhr79ji77bj8i8jt6mo.apps.googleusercontent.com">
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </GoogleOAuthProvider>
);
