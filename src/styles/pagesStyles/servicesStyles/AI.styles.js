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
  padding: 4rem 2rem;
  margin: 3rem auto;
  max-width: 1140px;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  position: relative;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.background};

  .animate.visible {
    animation: fadeInUp 0.5s ease forwards;
  }

  ${fadeInUp}
`;

export const ServiceTitle = styled.h2`
  font-size: 2.4rem;
  font-weight: 700;
  margin-bottom: 2rem;
  text-align: left;
  color: ${({ theme }) => theme.colors.primary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const ServiceList = styled.ul`
  list-style: none;
  padding-left: 0;

  li {
    font-size: 1.1rem;
    line-height: 1.7;
    margin-bottom: 1.2rem;
    padding-left: 1.8rem;
    position: relative;
    color: ${({ theme }) => theme.colors.text};

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
  font-size: 1.2rem;
  line-height: 1.9;
  margin-bottom: 2rem;
  text-align: left;
  color: ${({ theme }) => theme.colors.text};
`;

export const HighlightText = styled.div`
  margin: 3rem 0;
  font-size: 1.2rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  border-left: 4px solid ${({ theme }) => theme.colors.accent};
  background: ${({ theme }) => theme.colors.backgroundAlt};
  padding: 1.5rem 2rem;
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);

  transition:
    transform 0.3s ease,
    background 0.3s ease,
    box-shadow 0.3s ease; /* Se agregó box-shadow */

  &.visible {
    animation: fadeInUp 0.5s ease forwards;
  }

  &:hover {
    transform: scale(1.01);
  }

  ${fadeInUp}
`;

export const Divider = styled.hr`
  border: none;
  height: 3px;
  background: ${({ theme }) => theme.colors.accent};
  margin: 2rem;
  margin-left: 0;
  position: relative;
  width: 0;
  transform-origin: left;

  &.visible {
    width: 40%;
    transition: width 1s ease-in-out;
  }

  &.hidden {
    width: 0;
  }
`;

export const NumberedList = styled.ol`
  list-style: none;
  counter-reset: list;
  padding-left: 0;
  margin-top: 1rem;

  li {
    counter-increment: list;
    font-size: 1.1rem;
    line-height: 1.7;
    margin-bottom: 1.2rem;
    display: flex;
    align-items: flex-start;
    color: ${({ theme }) => theme.colors.text};

    &::before {
      content: counter(list);
      width: 1.8rem;
      height: 1.8rem;
      border-radius: 6px;
      background: ${({ theme }) => theme.colors.accent};
      color: #fff;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      margin-right: 0.8rem;
      font-weight: 600;
      font-size: 1rem;
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
    padding-left: 1.8rem;
    position: relative;
    color: ${({ theme }) => theme.colors.text};

    &::before {
      content: "x";
      color: ${({ theme }) => theme.colors.accent};
      font-weight: bold;
      position: absolute;
      left: 0;
      top: 0.1rem;
    }
  }
`;
