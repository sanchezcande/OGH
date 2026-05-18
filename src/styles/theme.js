const theme = {
  colors: {
    primary: "#111111",
    primaryDark: "#000000",
    accent: "#CC5A50",        // Muted burgundy accent
    accentDark: "#333333",
    accentLight: "#F5F5F5",
    backgroundAlt: "#FAFAFA",
    secondary: "#F5F5F5",
    background: "#FFFFFF",
    text: "#111111",
    textMuted: "#71717A",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    muted: "#E4E4E7",
  },
  fonts: {
    main: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    heading: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    code: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 700,
  },
  fontSizes: {
    heroTitle: {
      desktop: "clamp(2.5rem, 5vw, 3rem)",
      mobile: "2rem",
    },
    sectionTitle: {
      desktop: "2rem",
      mobile: "1.8rem",
    },
    heroSubtitle: {
      desktop: "1.2rem",
      mobile: "1.1rem",
    },
    sectionSubtitle: {
      desktop: "1.1rem",
      mobile: "1rem",
    },
    body: {
      desktop: "1rem",
      mobile: "0.95rem",
    },
    small: {
      desktop: "0.9rem",
      mobile: "0.85rem",
    },
    button: {
      desktop: "1rem",
      mobile: "0.95rem",
    },
    ctaButton: {
      desktop: "1rem",
      mobile: "1rem",
    },
    cardTitle: {
      desktop: "1.15rem",
      mobile: "1rem",
    },
    cardText: {
      desktop: "0.9rem",
      mobile: "0.85rem",
    },
  },
  lineHeights: {
    tight: "1.2",
    normal: "1.5",
    relaxed: "1.6",
    loose: "1.8",
  },
  spacing: {
    xs: "4px",
    small: "8px",
    medium: "16px",
    large: "24px",
    xl: "32px",
    xxl: "48px",
    xxxl: "64px",
  },
  borderRadius: "8px",
  borderRadiusLarge: "16px",
  borderRadiusSmall: "4px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
  boxShadowHover: "0 10px 25px rgba(0, 0, 0, 0.1)",
  transition: "all 0.3s ease",
};

export default theme;
