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
  border-radius: 16px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  position: relative;

  .animate.visible {
    animation: fadeInUp 0.5s ease forwards;
  }

  ${fadeInUp}
`;

export const ServiceTitle = styled.h2`
  font-size: 2.8rem;
  font-weight: 700;
  margin-bottom: 2rem;
  text-align: left;
  color: ${({ theme }) => theme.colors.primary};
  text-transform: uppercase;
  border-bottom: 2px solid ${({ theme }) => theme.colors.accent};
  padding-bottom: 0.5rem;
`;

export const ServiceList = styled.ul`
  list-style: none;
  padding-left: 0;

  li {
    font-size: 1.1rem;
    line-height: 1.8;
    margin-bottom: 1.2rem;
    padding-left: 1.8rem;
    position: relative;

    &::before {
      content: "•";
      font-size: 1.5rem;
      color: ${({ theme }) => theme.colors.accent};
      position: absolute;
      left: 0;
      top: 0.1rem;
    }
  }
`;

export const Divider = styled.hr`
  border: none;
  height: 2px;
  background-color: ${({ theme }) => theme.colors.accent};
  margin: 2rem 0;
  width: 60%;
`;

export const HighlightText = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  border-left: 4px solid ${({ theme }) => theme.colors.accent};
  padding: 1rem 1.5rem;
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border-radius: ${({ theme }) => theme.borderRadius};
  margin: 2rem 0;
`;

export const Description = styled.p`
  font-size: 1.15rem;
  line-height: 1.9;
  margin-bottom: 2rem;
  color: ${({ theme }) => theme.colors.text};
`;

export const NumberedList = styled.ol`
  list-style: none;
  counter-reset: list-counter;
  padding-left: 0;

  li {
    counter-increment: list-counter;
    font-size: 1.1rem;
    line-height: 1.8;
    margin-bottom: 1.2rem;
    display: flex;
    align-items: flex-start;

    &::before {
      content: counter(list-counter);
      font-weight: bold;
      width: 1.8rem;
      height: 1.8rem;
      border-radius: 50%;
      background: ${({ theme }) => theme.colors.accent};
      color: white;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      margin-right: 0.8rem;
      font-size: 1rem;
    }
  }
`;

export const ServiceListCross = styled.ul`
  list-style: none;
  padding-left: 0;

  li {
    font-size: 1.1rem;
    line-height: 1.8;
    margin-bottom: 1rem;
    padding-left: 1.8rem;
    position: relative;

    &::before {
      content: "x";
      color: ${({ theme }) => theme.colors.accentDark};
      font-weight: bold;
      position: absolute;
      left: 0;
      top: 0.2rem;
    }
  }
`;
