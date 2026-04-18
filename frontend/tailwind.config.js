/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neu-bg': '#1E232E',
        'neu-bg-light': '#242A37',
        'neu-bg-dark': '#181C26',
        'neu-surface': '#232939',
        'neu-highlight': '#2A3144',
        'neu-shadow-light': '#283048',
        'neu-shadow-dark': '#141820',
        'accent-indigo': '#6366F1',
        'accent-cyan': '#22D3EE',
        'accent-magenta': '#E879F9',
        'heat-red': '#F87171',
        'heat-yellow': '#FBBF24',
        'heat-grey': '#9CA3AF',
        'heat-blue': '#60A5FA',
        'text-primary': '#E2E8F0',
        'text-secondary': '#94A3B8',
        'text-muted': '#64748B',
      },
      boxShadow: {
        'neu-extruded': '6px 6px 14px #141820, -6px -6px 14px #283048',
        'neu-extruded-sm': '3px 3px 8px #141820, -3px -3px 8px #283048',
        'neu-inset': 'inset 4px 4px 10px #141820, inset -4px -4px 10px #283048',
        'neu-inset-sm': 'inset 2px 2px 6px #141820, inset -2px -2px 6px #283048',
        'glow-cyan': '0 0 20px rgba(34,211,238,0.3), 0 0 60px rgba(34,211,238,0.1)',
        'glow-magenta': '0 0 20px rgba(232,121,249,0.3), 0 0 60px rgba(232,121,249,0.1)',
        'glow-indigo': '0 0 20px rgba(99,102,241,0.3), 0 0 60px rgba(99,102,241,0.1)',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 8s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'data-stream': 'data-stream 2s linear infinite',
        'scan-line': 'scan-line 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotateX(0deg)' },
          '50%': { transform: 'translateY(-20px) rotateX(2deg)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(1deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(34,211,238,0.3)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 40px rgba(34,211,238,0.6)' },
        },
        'data-stream': {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
}
