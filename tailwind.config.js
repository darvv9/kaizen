/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#08080a",
          900: "#0a0a0c",
          850: "#111114",
          800: "#16161a",
          700: "#1f1f25",
          600: "#2a2a31",
        },
        accent: {
          DEFAULT: "#ffffff",
          soft: "#e7e7ee",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Inter",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
      },
      /* Uma escala de cantos só: bloco < campo/linha < card < sheet. */
      borderRadius: {
        sm2: "0.625rem",
        md2: "0.875rem",
        lg2: "1.25rem",
        xl2: "1.75rem",
      },
      boxShadow: {
        glow: "0 0 24px -4px rgba(255,255,255,0.35)",
        sheet: "0 -12px 40px rgba(0,0,0,0.45)",
      },
      keyframes: {
        /* Troca de aba: só opacidade. Nada desliza sozinho na tela. */
        fade: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        fade: "fade 0.16s ease-out both",
      },
    },
  },
  plugins: [],
};
