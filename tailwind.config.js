/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Dark mode toggling
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        textColor: 'var(--text-color)',
        chatBg: 'var(--chat-bg)',
      },
    },
  },
  plugins: [],
};