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

const pulseEffect = `
  @keyframes pulseEffect {
    0% {
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.7);
    }
    50% {
      box-shadow: 0 0 20px rgba(0, 255, 255, 1);
    }
    100% {
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.7);
    }
  }
`;

export const ServiceContainer = styled.section`
  background: linear-gradient(135deg, #1a1f36, #0d1222);
  color: ${({ textColor }) => textColor || "#e0e0e0"};
  padding: 3rem 2rem;
  margin: 2rem auto;
  max-width: 1200px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
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
    filter: blur(120px);
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
  font-size: 3.2rem;
  font-weight: 800;
  margin-bottom: 2rem;
  color: white;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 3px;

  &.visible {
    animation: fadeInUp 0.5s ease forwards;
  }
`;

export const ServiceList = styled.ul`
  list-style: none;
  margin-left: 0;
  padding-left: 0;
  position: relative;

  li {
    font-size: 1.4rem;
    line-height: 2;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    position: relative;
    padding-left: 3rem;
    color: #b0eaff;

    &.visible {
      animation: fadeInUp 0.5s ease forwards;
    }

    &::before {
      content: "⚙️";
      font-size: 1.6rem;
min-width: 2.5rem;
      border-radius: 50%;
  
      color: #00ffdd;
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%) scale(1);
      transition: transform 0.3s ease, color 0.3s ease;
    }

    &:hover::before {
      transform: translateY(-50%) scale(1.4);
      color: #ff6ec7;
    }

    &:hover {
      color: #00ffdd;
      text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
    }
  }

  ${fadeInUp}
  ${pulseEffect}
`;


export const HighlightText = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  text-align: left;
  margin-top: 2rem;
  color: #ffffff;
  position: relative;
  background: linear-gradient(135deg, rgba(0, 198, 255, 0.4), rgba(0, 114, 255, 0.4));
  border: 2px dashed rgba(255, 255, 255, 0.6);
  padding: 1.5rem;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
  transition: transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease; /* Se agregó box-shadow */

  &.visible {
    animation: fadeInUp 0.5s ease forwards;
  }

  &:hover {
    transform: scale(1.01);
    background: linear-gradient(135deg, rgba(0, 255, 255, 0.5), rgba(0, 198, 255, 0.5));
    box-shadow: 0 0 30px rgba(0, 255, 255, 0.7);
  }

  ${fadeInUp}
`;


export const Description = styled.p`
  font-size: 1.3rem;
  line-height: 1.8;
  margin-bottom: 2rem;
  text-align: left;
  color: #b0d4ff;
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
    font-size: 1.3rem;
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
      background: linear-gradient(135deg, #00c6ff, #00ffdd);
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
      width: 2.5rem;
      height: 2.5rem;
      position: relative;
      z-index: 1;
      min-width: 2.5rem;
    }

    &:hover::before {
      transform: scale(1.4);
      background: white;
      color: #00c6ff;
    }

    &:hover {
      color: #00ffdd;
      text-shadow: 0 0 10px rgba(0, 255, 255, 0.7);
    }
  }
`;

export const ServiceListCross = styled.ul`
  list-style: none;
  margin-left: 0;
  padding-left: 0;

  li {
    font-size: 1.2rem;
    line-height: 1.8;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    position: relative;
    padding-left: 1.5rem;
    color: #b0d4ff;
    transition: color 0.3s ease;

    &.visible {
      animation: fadeInUp 0.5s ease forwards;
    }

    &::before {
      content: "⨉";
      color: red;
      font-weight: bold;
      position: absolute;
      left: 0;
      z-index: 1;
      transition: transform 0.3s ease;
      font-size: 1.5rem;
      margin-right: 1rem !important; 
    }

    &:hover::before {
      transform: scale(1.4);
    }

    &:hover {
      color: red;
      text-shadow: 0 0 10px rgba(255, 0, 0, 0.7);
    }
  }

  ${fadeInUp}
`;
export const Divider = styled.hr`
  border: none;
  height: 3px;
  background-color: #00c6ff;
  margin: 2rem 0;
  position: relative;
  width: 0;
  transform-origin: left;

  &.visible {
    width: 70%;
    transition: width 1s ease-in-out;
  }

  &.hidden {
    width: 0;
  }
`;

