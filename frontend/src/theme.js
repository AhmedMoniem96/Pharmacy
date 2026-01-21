import { createTheme } from '@mui/material/styles';

// Luxury Color Palette
const colors = {
  primary: {
    main: '#004d40', // Deep Teal/Emerald
    light: '#39796b',
    dark: '#00251a',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#ffd700', // Gold
    light: '#ffff52',
    dark: '#c7a500',
    contrastText: '#000000',
  },
  background: {
    default: '#f4f6f8',
    paper: '#ffffff',
    darkDefault: '#121212',
    darkPaper: '#1e1e1e',
  },
  text: {
    primary: '#212121',
    secondary: '#757575',
    darkPrimary: '#ffffff',
    darkSecondary: '#b0bec5',
  }
};

export const getTheme = (mode, direction) => createTheme({
  direction: direction,
  palette: {
    mode,
    primary: colors.primary,
    secondary: colors.secondary,
    background: {
      default: mode === 'dark' ? colors.background.darkDefault : colors.background.default,
      paper: mode === 'dark' ? colors.background.darkPaper : colors.background.paper,
    },
    text: {
      primary: mode === 'dark' ? colors.text.darkPrimary : colors.text.primary,
      secondary: mode === 'dark' ? colors.text.darkSecondary : colors.text.secondary,
    },
  },
  typography: {
    fontFamily: direction === 'rtl' ? '"Cairo", "Roboto", "Helvetica", "Arial", sans-serif' : '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
          },
        },
        containedPrimary: {
          background: `linear-gradient(45deg, ${colors.primary.main} 30%, ${colors.primary.light} 90%)`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: mode === 'dark' ? '0px 4px 20px rgba(0,0,0,0.4)' : '0px 4px 20px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 10px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});