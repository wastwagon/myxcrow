// Toast styling is configured in pages/_app.tsx (react-hot-toast).
export const toastConfig = {
  duration: 3500,
  position: 'top-center' as const,
  style: {
    background: 'rgba(42, 28, 30, 0.95)',
    color: '#fff',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: 500,
  },
  success: {
    duration: 3000,
    iconTheme: {
      primary: '#d0ab63',
      secondary: '#160f10',
    },
  },
  error: {
    duration: 4000,
    iconTheme: {
      primary: '#ff453a',
      secondary: '#fff',
    },
  },
};
