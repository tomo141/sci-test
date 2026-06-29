import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Noto Sans JP",
          "Hiragino Sans",
          "Hiragino Kaku Gothic ProN",
          "Yu Gothic",
          "Meiryo",
          "system-ui",
          "sans-serif"
        ]
      },
      boxShadow: {
        card: "0 8px 24px rgba(24, 70, 150, 0.08)",
        float: "0 18px 44px rgba(15, 55, 130, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
