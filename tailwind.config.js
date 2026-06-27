/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounce 2s infinite",
        "shimmer": "shimmer 2s infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        "glow-blue": "0 0 20px rgba(59, 130, 246, 0.5)",
        "glow-blue-lg": "0 0 40px rgba(59, 130, 246, 0.3)",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".custom-scrollbar": {
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(71, 85, 105, 0.5)",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "rgba(71, 85, 105, 0.8)",
          },
        },
        ".glass": {
          background: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(10px)",
          borderColor: "rgba(71, 85, 105, 0.3)",
        },
      });
    },
  ],
};