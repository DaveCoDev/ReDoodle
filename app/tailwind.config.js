/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "selector",
  theme: {
    colors: {
      pastelBlue: {
        DEFAULT: "#D0F0FD",
        rgb: "208, 240, 253",
      },
      pastelCoral: {
        DEFAULT: "#FFB5A7",
        rgb: "255, 181, 167",
        hover: "#FFA597",
        active: "#FF9587",
      },
      pastelPeach: {
        DEFAULT: "#FFD8B1",
        rgb: "255, 216, 177",
      },
      pastelGreen: {
        DEFAULT: "#B2F7EF",
        rgb: "178, 247, 239",
      },
      pastelGray: {
        DEFAULT: "#333333",
        rgb: "51, 51, 51",
      },
      pastelLighterGray: {
        DEFAULT: "#6D6D6D",
        rgb: "109, 109, 109",
      },
      pastelWhite: {
        DEFAULT: "#FFFFFF",
        rgb: "255, 255, 255",
      },
      pastelBlueLightGray: {
        DEFAULT: "#E1EDF2",
        rgb: "255, 255, 255",
      },
      darkGray: {
        DEFAULT: "#222222",
        rgb: "34, 34, 34",
      },
    },
    extend: {
      margin: {
        17: "68px",
        18: "72px",
        19: "76px",
      },
      padding: {
        17: "68px",
        18: "72px",
        19: "76px",
      },
      keyframes: {
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        slideLeft: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideRight: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slidePrevLeft: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        slidePrevRight: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        gradient: "gradient 3s ease infinite",
        slideLeft: "slideLeft 0.3s ease-out",
        slideRight: "slideRight 0.3s ease-out",
        slidePrevLeft: "slidePrevLeft 0.3s ease-out",
        slidePrevRight: "slidePrevRight 0.3s ease-out",
      },
      backgroundSize: {
        gradient: "400% 400%",
      },
    },
  },
  plugins: [],
};
