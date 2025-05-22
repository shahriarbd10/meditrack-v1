import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId="389432776360-6eqojkuaos6c8uhr79ji77bj8i8jt6mo.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);
