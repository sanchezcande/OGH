import styled from "styled-components";

export const ServiceContainer = styled.section`
  background: linear-gradient(145deg, #101b42, #0b2343);
  color: ${({ textColor }) => textColor || "#ffffff"};
  padding: 3rem 2rem;
  margin: 2rem auto;
  max-width: 1200px;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;
transition: all 0.3s ease;
 


  &::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(0, 212, 255, 0.2), transparent);
    z-index: 0;
  }

  &:hover {
    box-shadow: 0 10px 20px rgba(0, 212, 255, 0.5);
  }

  @keyframes glowEffect {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

export const ServiceTitle = styled.h2`
  font-size: 2.8rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  text-align: center;
  color: white;

  text-transform: uppercase;
 &.animated {
    font-size: 2.5rem;
    color: white;
  }
`;

export const ServiceList = styled.ul`
  list-style: none;
  margin-left: 0;
  padding-left: 0;

  li {
    font-size: 1.2rem;
    line-height: 1.8;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    position: relative;
    padding-left: 1rem;
    background: linear-gradient(90deg, rgba(0, 212, 255, 0.1), transparent);
    border-left: 4px solid #00d4ff;
    border-radius: 4px;
    overflow: hidden;
    transition: all 0.3s ease;

    &::before {
      content: "✨"; 
      font-size: 1.5rem;
      margin-right: 0.5rem;
      color: #00d4ff;
      animation: iconPulse 1.5s infinite ease-in-out;
    }

    &:hover {
      background: rgba(0, 212, 255, 0.2);
      border-left-color: #00ffff;
      transform: scale(1.02);
    }
  }

  @keyframes iconPulse {
    0%, 100% {
      transform: scale(1);
      color: #00d4ff;
    }
    50% {
      transform: scale(1.3);
      color: #00ffff;
    }
  }
`;

export const Description = styled.p`
  font-size: 1.3rem;
  line-height: 2;
  margin-bottom: 2rem;
  text-align: center;
  color: #cce7ff;
`;

export const HighlightText = styled.div`
  text-align: center;
  margin: 3rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  border: 2px dashed #00d4ff;
  padding: 1.2rem;
  border-radius: 12px;
  background: rgba(0, 212, 255, 0.05);
  box-shadow: 0 4px 10px rgba(0, 212, 255, 0.3);

  span {
    display: inline-block;
    position: relative; 
    z-index: 1;
    transition: all 0.3s ease;
    }
    span:hover {
        transform: scale(1.02);
    }

  @keyframes dashedGlow {
    0% {
      border-color: #00d4ff;
    }
    50% {
      border-color: #00ffff;
    }
    100% {
      border-color: #00d4ff;
    }
  }
`;

export const Divider = styled.hr`
  border: none;
  height: 3px;
  background: white;
  margin: 2rem auto;
  width: 60%;
  animation: slideInDivider 1s ease-out forwards;

  @keyframes slideInDivider {
    from {
      width: 0;
    }
    to {
      width: 60%;
    }
  }
`;

export const NumberedList = styled.ol`
  list-style: none;
  counter-reset: list-counter;
  margin-left: 0;
  padding-left: 0;
  transition: all 0.3s ease;
  transform-origin: center;


  li {
    counter-increment: list-counter;
    font-size: 1.1rem;
    line-height: 1.8;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    position: relative;
    transition: all 0.3s ease;



    &::before {
      content: counter(list-counter);
      background: linear-gradient(135deg, #00d4ff, #007acc);
      color: white;
      font-weight: bold;
      font-size: 1.2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 8%;
      margin-right: 1rem;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      transition: transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
      width: 2.5rem;
      height: 2.5rem;

      min-width: 2.5rem;
    }

    &:hover::before {
      transform: rotate(360deg) scale(1.2);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    }

    &:hover {
        text-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
        }
  }
`;
