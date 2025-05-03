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

const drawLine = `
  @keyframes drawLine {
    from {
      width: 0;
    }
    to {
      width: 50%;
    }
  }
`;

export const ServiceContainer = styled.section`
  background: ${({ theme }) => theme.colors.backgroundAlt}; 
  color: ${({ theme }) => theme.colors.text};
  padding: 3rem 2rem;
  margin: 2rem auto;
  max-width: 1200px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;

  .visible {
    animation: fadeInUp 0.5s ease forwards;
  }

  ${fadeInUp}
`;

export const ServiceTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.colors.primary};
  text-transform: uppercase;

  &.visible {
    animation: fadeInUp 0.5s ease forwards;
  }

  ${fadeInUp}
`;

export const ServiceList = styled.ul`
  list-style: none;
  margin-left: 0;
  padding-left: 0;

  li {
    font-size: 1.1rem;
    line-height: 1.8;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    position: relative;
    padding-left: 1.5rem;


    &.visible {
      animation: fadeInUp 0.5s ease forwards;
    }

    &::before {
      content: "✓";
      color: ${({ theme }) => theme.colors.accent};
      font-weight: bold;
      position: absolute;
      left: 0;
      top: 0;
      z-index: 1;
    }
       &::after {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      width: 1.5rem;
      height: 100%;
      background-color: ${({ theme }) => theme.colors.backgroundAlt};
      transform: scaleX(0);
      transform-origin: right;
      transition: transform 0.5s ease-in-out;
      z-index: 2;
    }

    &:hover::after {
      transform: scaleX(1);
      animation: revealCheck 0.5s ease-in-out forwards;
    }
  }

  @keyframes revealCheck {
    from {
      transform: scaleX(1);
    }
    to {
      transform: scaleX(0);
    }
  }
  }

  ${fadeInUp}
`;

export const HighlightText = styled.p`
  font-size: 1.3rem;
  font-weight: 600;
  text-align: center;
  margin-top: 2rem;
  color: ${({ theme }) => theme.colors.accent};
  transition: -webkit-text-stroke 0.3s ease, color 0.3s ease;


  &.visible {
    animation: fadeInUp 0.5s ease forwards;
  }

  &:hover {
    -webkit-text-stroke: 0.5px ${({ theme }) => theme.colors.accentDark};
  }

  ${fadeInUp}
`;

export const Divider = styled.hr`
  border: none;
  height: 3px;
  background-color: ${({ theme }) => theme.colors.accent};
  margin: 2rem 0;
  width: 0;
  margin-right: auto;

  &.visible {
    animation: drawLine 1s ease-out forwards;
  }

  ${drawLine}
`;

export const Description = styled.p`
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 1rem;

  &.visible {
    animation: fadeInUp 0.5s ease forwards;
  }

  ${fadeInUp}
`;

export const NumberedList = styled.ol`
  list-style: none;
  counter-reset: list-counter;
  margin-left: 0;
  padding-left: 0;

  li {
    counter-increment: list-counter;
    font-size: 1.1rem;
    line-height: 1.8;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;


    &.visible {
      animation: fadeInUp 0.5s ease forwards;
    }

    &::before {
      content: counter(list-counter);
      background-color: ${({ theme }) => theme.colors.accent};
      color: ${({ theme }) => theme.colors.background};
      font-weight: bold;
      font-size: 1.2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 50%;
      margin-right: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      width: 2rem;
      height: 2rem;
      line-height: 2rem;
      min-width: 2rem;
       transition: transform 0.3s ease;
    }

    &:hover::before {
      transform: scale(1.1);
    }
  }

  ${fadeInUp}
`;
  
