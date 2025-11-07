/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
      },
      colors: {
        cardvance: {
          white: "#FFFFFF",
          offWhite: "#FAFAFA",
          softGray: "#F8F9FA",
          lightGray: "#E5E7EB",
          mediumGray: "#9CA3AF",
          darkGray: "#374151",
          charcoal: "#1F2937",
          accent: "#3B82F6",
          accentHover: "#2563EB",
          accentLight: "#EFF6FF",
        },
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(0,0,0,0.08)",
        medium: "0 4px 6px rgba(0,0,0,0.07)",
      },
      borderRadius: {
        card: "12px",
        button: "8px",
      },
    },
  },
  plugins: [],
};
