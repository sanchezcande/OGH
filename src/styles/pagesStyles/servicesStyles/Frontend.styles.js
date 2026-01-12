import styled from "styled-components";

const fadeInUp = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const ServiceContainer = styled.section`
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  padding: 3rem 2rem;
  margin: 2rem auto;
  max-width: 1200px;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  position: relative;
  overflow: hidden;

  .animate.visible {
    animation: fadeInUp 0.5s ease forwards;
  }

  ${fadeInUp}
`;

export const ServiceTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.sectionTitle.desktop};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: 1.5rem;
  text-align: left;
  color: ${({ theme }) => theme.colors.primary};
  text-transform: uppercase;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.sectionTitle.mobile};
  }
`;

export const ServiceList = styled.ul`
  list-style: none;
  padding-left: 0;

  li {
    font-size: ${({ theme }) => theme.fontSizes.body.desktop};
    line-height: ${({ theme }) => theme.lineHeights.relaxed};
    margin-bottom: 1.2rem;
    padding-left: 1.8rem;
    position: relative;

    @media (max-width: 768px) {
      font-size: ${({ theme }) => theme.fontSizes.body.mobile};
    }

    &::before {
      content: "";
      width: 10px;
      height: 10px;
      background-color: ${({ theme }) => theme.colors.accent};
      border-radius: 50%;
      position: absolute;
      left: 0;
      top: 0.6rem;
    }
  }
`;

export const Description = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sectionSubtitle.desktop};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
  margin-bottom: 2rem;
  text-align: left;
  color: ${({ theme }) => theme.colors.text};

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.sectionSubtitle.mobile};
  }
`;

export const HighlightText = styled.div`
  margin: 3rem 0;
  font-size: ${({ theme }) => theme.fontSizes.sectionSubtitle.desktop};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.primary};

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.sectionSubtitle.mobile};
  }
  border: 1px solid ${({ theme }) => theme.colors.accent};
  padding: 1.5rem;
  border-radius: ${({ theme }) => theme.borderRadius};
  background: ${({ theme }) => theme.colors.backgroundAlt};
  text-align: center;
  span {
    display: inline-block;
    transition:
      transform 0.3s ease,
      color 0.3s ease;
  }

  span:hover {
    transform: scale(1.03);
  }
`;

export const Divider = styled.hr`
  border: none;
  height: 3px;
  margin-left: 0 !important;
  background: ${({ theme }) => theme.colors.accent};
  margin: 2rem;
  width: 60%;
`;

export const NumberedList = styled.ol`
  list-style: none;
  counter-reset: list-counter;
  margin-left: 0;
  padding-left: 0;

  li {
    counter-increment: list-counter;
    font-size: ${({ theme }) => theme.fontSizes.body.desktop};
    line-height: ${({ theme }) => theme.lineHeights.relaxed};
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    position: relative;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;

    @media (max-width: 768px) {
      font-size: ${({ theme }) => theme.fontSizes.body.mobile};
    }

    &.visible {
      animation: fadeInUp 0.5s ease forwards;
    }

    &::before {
      content: counter(list-counter);
      background-color: ${({ theme }) => theme.colors.accent};
      color: white;
      font-weight: bold;
      font-size: 1.2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 8%;
      margin-right: 1rem;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      transition:
        transform 0.3s ease,
        background 0.3s ease,
        box-shadow 0.3s ease;
      width: 2rem;
      height: 2rem;
      min-width: 2rem;
    }
  }
`;
