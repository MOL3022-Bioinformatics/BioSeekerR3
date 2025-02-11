// styles/theme.js
export const theme = {
    background: 'var(--background)',
    foreground: 'var(--foreground)',
    textColor: 'var(--text-color)',
    chatBg: 'var(--chat-bg)',
    
    // Extended theme colors
    primary: {
      DEFAULT: '#3b82f6', // blue-500
      dark: '#2563eb',    // blue-600
      light: '#60a5fa'    // blue-400
    },
    secondary: {
      DEFAULT: '#303030',
      dark: '#212121',
      light: '#424242'
    },
    accent: {
      DEFAULT: '#8b5cf6', // violet-500
      dark: '#7c3aed',    // violet-600
      light: '#a78bfa'    // violet-400
    }
  };
  
  // Extend your tailwind.config.js
  module.exports = {
    content: [
      './pages/**/*.{js,jsx,ts,tsx}',
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