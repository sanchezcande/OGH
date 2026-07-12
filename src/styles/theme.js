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
    semibold: 500,
    bold: 600,
    black: 600,
  },
  fontSizes: {
    heroTitle: {
      desktop: "clamp(1.6rem, 3.2vw, 2.2rem)",
      mobile: "1.5rem",
    },
    sectionTitle: {
      desktop: "1.5rem",
      mobile: "1.3rem",
    },
    heroSubtitle: {
      desktop: "0.95rem",
      mobile: "0.88rem",
    },
    sectionSubtitle: {
      desktop: "0.95rem",
      mobile: "0.88rem",
    },
    body: {
      desktop: "0.92rem",
      mobile: "0.88rem",
    },
    small: {
      desktop: "0.82rem",
      mobile: "0.78rem",
    },
    button: {
      desktop: "0.88rem",
      mobile: "0.85rem",
    },
    ctaButton: {
      desktop: "0.88rem",
      mobile: "0.88rem",
    },
    cardTitle: {
      desktop: "1.02rem",
      mobile: "0.95rem",
    },
    cardText: {
      desktop: "0.85rem",
      mobile: "0.8rem",
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
  borderRadius: "4px",
  borderRadiusLarge: "4px",
  borderRadiusSmall: "4px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
  boxShadowHover: "0 10px 25px rgba(0, 0, 0, 0.1)",
  transition: "all 0.3s ease",
};

export default theme;
