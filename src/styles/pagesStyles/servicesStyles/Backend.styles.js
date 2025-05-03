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

const bounce = `
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }
`;

const pulseBorder = `
  @keyframes pulseBorder {
    0% {
      border-color: ${({ theme }) => theme.colors.primary};
    }
    50% {
      border-color: ${({ theme }) => theme.colors.primaryDark};
    }
    100% {
      border-color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

export const ServiceContainer = styled.section`
  background: linear-gradient(145deg, ${({ theme }) => theme.colors.secondary}, ${({ theme }) => theme.colors.muted});
  color: ${({ theme }) => theme.colors.text};
  padding: 3rem 2rem;
  margin: 2rem auto;
  max-width: 1200px;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  transition: box-shadow 0.3s ease;

  &:hover {
   box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }
`;

export const ServiceTitle = styled.h2`
  font-size: 2.8rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  text-align: left;
  color: ${({ theme }) => theme.colors.primary};
  text-transform: uppercase;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  opacity: 0;

  &.visible {
    animation: fadeInUp 0.5s ease forwards;
  }
  ${fadeInUp}
`;

export const ServiceList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    font-size: 1.2rem;
    line-height: 1.8;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.colors.text};
    border-left: 3px solid ${({ theme }) => theme.colors.primary};
    padding-left: 1rem;

    &.visible {
      animation: fadeInUp 0.5s ease forwards;
    }

    &::before {
      content: "💾";
      font-size: 1.5rem;
      margin-right: 0.5rem;
      color: ${({ theme }) => theme.colors.primary};
      display: inline-block;
      transition: transform 0.3s ease;
    }

    &:hover::before {
      animation: bounce 0.5s ease infinite;
    }

    &:hover {
      background: ${({ theme }) => theme.colors.background};
      border-left-color: ${({ theme }) => theme.colors.primaryDark};
    }

    ${bounce}
  }
`;

export const Description = styled.p`
  font-size: 1.2rem;
  line-height: 1.8;
  margin-bottom: 2rem;
  text-align: justify;
  color: ${({ theme }) => theme.colors.text};

  &.visible {
    animation: fadeInUp 0.5s ease forwards;
  }
`;

export const HighlightText = styled.div`
  text-align: center;
  margin: 3rem 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  border: 2px dashed ${({ theme }) => theme.colors.primary};
  padding: 1rem;
  border-radius: 8px;
  background: rgba(249, 123, 114, 0.08);
  transition: transform 0.2s ease;

  &:hover {
    animation: pulseBorder 1s infinite ease;
    transform: scale(1.02);
  }

  ${pulseBorder}
`;

export const Divider = styled.hr`
  border: none;
  height: 3px;
  background-color: ${({ theme }) => theme.colors.primary};
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

export const NumberedList = styled.ol`
  list-style: none;
  counter-reset: list-counter;
  margin: 0;
  padding: 0;

  li {
    counter-increment: list-counter;
    font-size: 1.1rem;
    line-height: 1.8;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;

    &.visible {
      animation: fadeInUp 0.5s ease forwards;
    }

    &::before {
      content: counter(list-counter);
      background-color: ${({ theme }) => theme.colors.primary};
      color: white;
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
`;
