/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Game-specific color palette
      colors: {
        // Dark theme base colors
        'dark-navy': '#0A0F1B',
        'dark-surface': '#0F1419',
        'dark-border': '#1A1F2E',
        
        // Neon accent colors for AI game
        'neon-mint': '#00F5D4',
        'neon-purple': '#A855F7',
        'neon-blue': '#3B82F6',
        'neon-pink': '#EC4899',
        
        // UI semantic colors
        'ui-bg': {
          50: '#F8FAFC',
          900: '#0A0F1B',
        },
        'ui-text': {
          50: '#F1F5F9',
          900: '#0F172A',
        },
        
        // Relationship/emotion colors
        'emotion': {
          happy: '#F59E0B',
          excited: '#EF4444',
          calm: '#10B981',
          sad: '#6366F1',
          neutral: '#6B7280',
        },
        
        // Game status colors
        'game-status': {
          online: '#10B981',
          away: '#F59E0B',
          busy: '#EF4444',
        }
      },
      
      // Typography for chat and game UI
      fontFamily: {
        'game': ['Inter', 'Noto Sans KR', 'sans-serif'],
        'chat': ['Inter', 'Noto Sans KR', 'sans-serif'],
        'ui': ['Inter', 'system-ui', 'sans-serif'],
      },
      
      // Spacing for game layout
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        'chat-height': '60vh',
        'character-width': '33.333%',
        'dialogue-width': '66.667%',
      },
      
      // Animation for AI responses and game effects
      animation: {
        'typing': 'typing 1.5s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-in',
        'message-in': 'messageIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      
      keyframes: {
        typing: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        glow: {
          '0%': { 
            boxShadow: '0 0 20px rgba(0, 245, 212, 0.5)',
            borderColor: 'rgba(0, 245, 212, 0.5)'
          },
          '100%': { 
            boxShadow: '0 0 30px rgba(0, 245, 212, 0.8)',
            borderColor: 'rgba(0, 245, 212, 0.8)'
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { 
            transform: 'translateY(20px)',
            opacity: '0' 
          },
          '100%': { 
            transform: 'translateY(0)',
            opacity: '1' 
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        messageIn: {
          '0%': {
            transform: 'translateX(-20px) scale(0.95)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateX(0) scale(1)',
            opacity: '1'
          },
        },
      },
      
      // Game-specific sizing
      aspectRatio: {
        'character': '3/4',
        'game-screen': '16/10',
      },
      
      // Glass morphism effects
      backdropBlur: {
        'xs': '2px',
      },
      
      // Border radius for modern UI
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      
      // Box shadows for depth
      boxShadow: {
        'neon': '0 0 20px rgba(0, 245, 212, 0.5)',
        'neon-purple': '0 0 20px rgba(168, 85, 247, 0.5)',
        'game-card': '0 4px 20px rgba(0, 0, 0, 0.15)',
        'dialogue': '0 2px 15px rgba(0, 0, 0, 0.1)',
        'character': '0 8px 30px rgba(0, 0, 0, 0.2)',
      },
      
      // Z-index layers
      zIndex: {
        'modal': '1000',
        'dropdown': '100',
        'overlay': '50',
        'tooltip': '200',
      }
    },
  },
  plugins: [
    // Add any additional Tailwind plugins here
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
  ],
}