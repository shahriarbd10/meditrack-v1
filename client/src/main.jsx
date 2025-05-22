import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId="461423145874-cj6v68vut85djh6i1m494i82v5l7doas.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);
