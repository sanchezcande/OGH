import styled from "styled-components";

export const ServiceContainer = styled.section`
  background: ${({ theme }) => theme.colors.backgroundAlt}; 
  color: ${({ theme }) => theme.colors.text};
  padding: 3rem 2rem;
  margin: 2rem auto;
  max-width: 1200px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

export const ServiceTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.colors.primary};
  text-transform: uppercase;
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
`;

export const ServiceListCross = styled.ul`
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

    &::before {
      content: "×";
      color: ${({ theme }) => theme.colors.accent};
      font-weight: bold;
      position: absolute;
      left: 0;
      top: 0;
      z-index: 1; 
    }
  }
`;

export const HighlightText = styled.p`
  font-size: 1.3rem;
  font-weight: 600;
  text-align: center;
  margin-top: 2rem;
  color: ${({ theme }) => theme.colors.accent};
  transition: -webkit-text-stroke 0.3s ease, color 0.3s ease;

  &:hover {
    -webkit-text-stroke: 0.5px ${({ theme }) => theme.colors.accentDark};
  }
`;

export const Divider = styled.hr`
  border: none;
  height: 3px;
  background-color: ${({ theme }) => theme.colors.accent};
  margin: 2rem 0;
  width: 0;
  margin-right: auto;
  animation: drawLine 1s ease-out forwards;

  @keyframes drawLine {
    from {
      width: 0;
    }
    to {
      width: 50%;
    }
  }
`;

export const Description = styled.p`
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text};
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
    transition: all 0.3s ease;

    &:hover::before {
      transform: scale(1.3);
      transition: transform 0.3s ease;
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
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      transition: transform 0.3s ease;
      width: 2rem;
      height: 2rem;
      line-height: 2rem;
      min-width: 2rem;
    }
  }
`;
  
