const theme = {
  colors: {
    primary: '#2B2B2B',        // Main text color
    primaryDark: '#1A1A1A',    // Darker version for more emphasis
    accent: '#F97B72',         // Coral accent color - primary CTAs, highlights
    accentDark: '#E35A52',     // Darker coral for hover states
    accentLight: '#FFE3E1',    // Very light coral for backgrounds
    backgroundAlt: '#FFF5F5',  // Alternate background color
    secondary: '#F0F0F0',      // Secondary elements, cards, etc.
    background: '#FFFFFF',     // Main background color
    text: '#2B2B2B',           // Main text color
    textMuted: '#6B7280',      // Less emphasis text
    success: '#10B981',        // Success color
    warning: '#F59E0B',        // Warning color
    error: '#EF4444',          // Error color
    muted: '#E5E7EB'           // Borders, lines, subtle details
  },
  fonts: {
    main: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    heading: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    code: "'Fira Code', 'Courier New', monospace"
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900
  },
  spacing: {
    xs: '4px',
    small: '8px',
    medium: '16px',
    large: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px'
  },
  borderRadius: '8px',
  borderRadiusLarge: '16px',
  borderRadiusSmall: '4px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  boxShadowHover: '0 10px 25px rgba(0, 0, 0, 0.12)',
  transition: 'all 0.3s ease'
};

export default theme;
