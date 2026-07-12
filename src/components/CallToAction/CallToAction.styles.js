import styled, { keyframes } from "styled-components";

const sweep = keyframes`
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
`;

export const CallToActionContainer = styled.div`
  text-align: center;
  margin: 4rem auto;
  padding: 4rem 2.5rem;
  max-width: 800px;
  position: relative;
  border-radius: 4px;
  background: #fff;

  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    margin: 3rem 1rem;
    padding: 3rem 1.5rem;
  }
`;

export const CallToActionTitle = styled.h2`
  font-size: clamp(1.2rem, 2.2vw, 1.5rem);
  font-weight: 500;
  margin-bottom: 0.75rem;
  color: #111;
  line-height: 1.3;
  letter-spacing: -0.015em;

  span {
    color: #CC5A50;
  }

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

export const CallToActionDescription = styled.p`
  font-size: 0.85rem;
  margin-bottom: 2rem;
  color: #999;
  max-width: 420px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 0.85rem;
    margin-bottom: 1.75rem;
  }
`;

export const CallToActionButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  font-weight: 500;
  font-size: 0.85rem;
  border-radius: 60px;
  text-decoration: none;
  cursor: pointer;
  letter-spacing: 0.01em;
  color: #111;
  background: transparent;
  border: 1.5px solid #ddd;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  isolation: isolate;

  /* Shine sweep on hover */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(
      105deg,
      transparent 20%,
      rgba(255, 255, 255, 0.8) 50%,
      transparent 80%
    );
    transition: none;
    pointer-events: none;
  }

  .cta-arrow {
    display: inline-block;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:hover {
    border-color: #111;
    background: #111;
    color: #fff;

    &::before {
      transition: left 0.5s ease;
      left: 150%;
    }

    .cta-arrow {
      transform: translateX(5px);
    }
  }

  @media (max-width: 768px) {
    padding: 13px 28px;
    font-size: 0.9rem;
  }
`;
