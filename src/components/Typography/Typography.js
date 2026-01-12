import styled from "styled-components";

/**
 * Typography Components - Sistema de tipografía global
 * 
 * Uso:
 * <HeroTitle>Mi Título</HeroTitle>
 * <SectionTitle>Sección</SectionTitle>
 * <BodyText>Texto del cuerpo</BodyText>
 * 
 * Todos los componentes incluyen responsive (desktop/mobile) automáticamente
 */

export const HeroTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.heroTitle.desktop};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  line-height: ${({ theme }) => theme.lineHeights.tight};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.heroTitle.mobile};
  }
`;

export const HeroSubtitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.heroSubtitle.desktop};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.heroSubtitle.mobile};
    line-height: ${({ theme }) => theme.lineHeights.normal};
  }
`;

export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.sectionTitle.desktop};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  line-height: ${({ theme }) => theme.lineHeights.tight};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.sectionTitle.mobile};
  }
`;

export const SectionSubtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sectionSubtitle.desktop};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  line-height: ${({ theme }) => theme.lineHeights.normal};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.sectionSubtitle.mobile};
  }
`;

export const BodyText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.body.desktop};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  line-height: ${({ theme }) => theme.lineHeights.normal};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.body.mobile};
  }
`;

export const SmallText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small.desktop};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  line-height: ${({ theme }) => theme.lineHeights.normal};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.small.mobile};
  }
`;

export const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.cardTitle.desktop};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  line-height: ${({ theme }) => theme.lineHeights.normal};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.cardTitle.mobile};
  }
`;

export const CardText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.cardText.desktop};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  line-height: ${({ theme }) => theme.lineHeights.normal};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.cardText.mobile};
  }
`;

// Helper function para obtener tamaños de fuente (útil para styled-components inline)
export const getFontSize = (type, device = "desktop") => {
  return ({ theme }) => {
    if (theme.fontSizes[type] && theme.fontSizes[type][device]) {
      return theme.fontSizes[type][device];
    }
    return theme.fontSizes.body[device];
  };
};

