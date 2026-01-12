import styled from "styled-components";

export const FAQContainer = styled.section`
  background: ${({ theme }) => theme.colors.background}; // Ej: #f9f9f9
  color: ${({ theme }) => theme.colors.text}; // Ej: #333333
  padding: 3rem 2rem;
  margin: 2rem auto;
  max-width: 1200px;
  border-radius: 12px;
  box-shadow: ${({ theme }) =>
    theme.boxShadow}; // Ej: 0 4px 12px rgba(0,0,0,0.05)
`;

export const FAQTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.sectionTitle.desktop};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  margin-bottom: 2rem;
  text-align: left;
  color: ${({ theme }) => theme.colors.primaryDark};
  margin-left: 2.6rem;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.sectionTitle.mobile};
  }
`;

export const FAQTitle1 = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.sectionTitle.desktop};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: 2rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.primary};

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.sectionTitle.mobile};
  }
`;

export const FAQList = styled.ul`
  list-style: none;
  padding: 0;

  li {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    position: relative;
    padding-left: 2.5rem;
    opacity: 0;
    transform: translateY(20px);
    will-change: opacity, transform;
    transition:
      opacity 0.6s ease,
      transform 0.6s ease;

    &.visible {
      opacity: 1;
      transform: translateY(0);
    }

    &::before {
      content: "➤";
      position: absolute;
      left: 0;
      top: 0;
      color: ${({ theme }) => theme.colors.accent}; // coral
      font-size: 1.5rem;
      font-weight: bold;
      transition: transform 0.3s ease;
    }

    &:hover::before {
      transform: translateX(5px);
    }
  }
`;

export const Question = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.cardTitle.desktop};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.text};

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.cardTitle.mobile};
  }
`;

export const Answer = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.body.desktop};
  line-height: ${({ theme }) => theme.lineHeights.normal};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.backgroundAlt}; // Ej: #f1f1f1
  padding: 1rem;
  border-radius: 8px;
  transition: box-shadow 0.3s ease;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.body.mobile};
  }

  &:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
  }
`;
