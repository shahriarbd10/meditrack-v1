/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  // Critical: don't let OS dark mode toggle your styles
  darkMode: "class",

  theme: { extend: {} },

  plugins: [require("daisyui")],

  daisyui: {
    // Keep ONLY your light theme; also mirror it as "darkTheme"
    themes: [
      {
        meditrack: {
          primary: "#0ea5a8",   // teal
          secondary: "#38bdf8", // sky
          accent: "#22c55e",
          neutral: "#1f2937",
          "base-100": "#ffffff",
          "base-200": "#f6f9fc",
          "base-300": "#e9edf5",
          info: "#0ea5e9",
          success: "#16a34a",
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
    ],
    darkTheme: "meditrack",
  },
};
