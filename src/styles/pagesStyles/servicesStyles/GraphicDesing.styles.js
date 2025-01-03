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

const glowMove = `
  @keyframes glowMove {
    0% {
      transform: translate(-50%, -50%);
    }
    50% {
      transform: translate(50%, 50%);
    }
    100% {
      transform: translate(-50%, -50%);
    }
  }
`;

const gradientShift = `
  @keyframes gradientShift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

export const ServiceContainer = styled.section`
  background: linear-gradient(135deg, #0b2343, #152a56);
  color: ${({ textColor }) => textColor || "#f5f5f5"};
  padding: 3rem 2rem;
  margin: 2rem auto;
  max-width: 1200px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: -20%;
    left: -10%;
    width: 150%;
    height: 150%;
    background: radial-gradient(circle, rgba(0, 212, 255, 0.15), transparent);
    filter: blur(80px);
    z-index: 0;
    animation: glowMove 8s infinite ease-in-out;
  }


  .animate.visible {
    animation: fadeInUp 0.5s ease forwards;
  }

  ${fadeInUp}
  ${glowMove}
`;

export const ServiceTitle = styled.h2`
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 2rem;
  color: #ffffff;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 2px;
  position: relative;
  z-index: 1;
  background: linear-gradient(90deg, #00d4ff, white);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradientShift 5s infinite ease;

  &.visible {

    animation: fadeInUp 0.5s ease forwards;
  }

  ${fadeInUp}
  ${gradientShift}
`;

export const ServiceList = styled.ul`
  list-style: none;
  margin-left: 0;
  padding-left: 0;
  position: relative;

  li {
    font-size: 1.2rem;
    line-height: 2;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    position: relative;
    padding-left: 2.8rem;



    &.visible {
      animation: fadeInUp 0.5s ease forwards;
    }

    &::before {
      content: "📝";
      font-size: 1.8rem;
      color: #ff6ec7;
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%) scale(1);
      transition: transform 0.3s ease, color 0.3s ease;
    }

    &:hover::before {
      transform: translateY(-50%) scale(1.3);
      color: #00d4ff;
    }

    &:hover {
      color: #00d4ff;
      text-shadow: 0 0 8px rgba(0, 212, 255, 0.7);
    }
  }

  ${fadeInUp}
`;

export const Divider = styled.hr`
  border: none;
  height: 3px;
  background: linear-gradient(90deg, #00d4ff, white);
  margin: 2rem 0;
  width: 0;
  margin-right: auto;
  animation: drawLine 1.5s ease-out forwards;

  &.visible {

    animation: fadeInUp 0.5s ease forwards;
  }

  ${fadeInUp}
`;

export const HighlightText = styled.div`
  font-size: 1.6rem;
  font-weight: 700;
  text-align: left;
  margin-top: 2rem;
  color: #ffffff;
  position: relative;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(0, 122, 204, 0.3));
  border: 2px dashed rgba(255, 255, 255, 0.6);
  padding: 1.5rem;
  border-radius: 16px;
  overflow: hidden;
  transition: transform 0.3s ease, background 0.3s ease;

  &.visible {

    animation: fadeInUp 0.5s ease forwards;
  }

  &:hover {
    transform: scale(1.01);
    background: linear-gradient(135deg, rgba(0, 122, 204, 0.4), rgba(0, 212, 255, 0.4));
  }

  ${fadeInUp}
`;

export const Description = styled.p`
  font-size: 1.2rem;
  line-height: 1.8;
  margin-bottom: 2rem;
  text-align: left;
  color: #e0e0e0;
  position: relative;
  z-index: 1;

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
    font-size: 1.2rem;
    line-height: 2;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    position: relative;

    &.visible {
      animation: fadeInUp 0.5s ease forwards;
    }

    &::before {
      content: counter(list-counter);
      background: ${({ theme }) => theme.colors.lightBlue};
      color: white;
      font-weight: bold;
      font-size: 1.2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 50%;
      margin-right: 1rem;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      transition: transform 0.3s ease, background 0.3s ease;
      width: 2rem;
      height: 2rem;
      position: relative;
      z-index: 1;
      min-width: 2rem;
    }

    &:hover::before {
      transform: scale(1.3);
      background: white;
      color: ${({ theme }) => theme.colors.lightBlue};
    }

    &:hover {
      color: #007acc;
      text-shadow: 0 0 8px rgba(0, 122, 204, 0.7);
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
    color: white;
    transition: color 0.3s ease;

    &.visible {
      animation: fadeInUp 0.5s ease forwards;
    }

    &::before {
      content: "x";
      color: red;
      font-weight: bold;
      position: absolute;
      left: 0;
      top: 0;
      z-index: 1;
      transition: transform 0.3s ease;
    }

    &:hover::before {
      transform: scale(1.3);
    }

    &:hover {
      color: red;
      text-shadow: 0 0 8px rgba(255, 0, 0, 0.7);
    }
  }

  ${fadeInUp}
`;
