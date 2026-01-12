import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const CallToActionContainer = styled.div`
  text-align: center;
  margin: 4rem auto;
  padding: 2.5rem 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: #1e293b;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  max-width: 900px;
  position: relative;
  border: 1px solid #e2e8f0;

  /* Estado inicial para la animación */
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.4s ease;

  /* Cuando el componente es visible */
  &.visible {
    opacity: 1;
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    margin: 3rem 1rem;
    padding: 2rem 1.5rem;
  }
`;

export const CallToActionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #1e293b;
  position: relative;
  z-index: 2;
  line-height: 1.3;

  span {
    color: #f97b72;
    font-weight: 700;
  }

  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

export const CallToActionDescription = styled.p`
  font-size: 1rem;
  margin-bottom: 1.5rem;
  color: #475569;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
  z-index: 2;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 0.95rem;
    margin-bottom: 1.25rem;
  }
`;

export const CallToActionButton = styled.a`
  background: #f97b72;
  color: white;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 8px;
  text-decoration: none;
  margin-top: 0;
  display: inline-block;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  z-index: 2;
  border: 2px solid #f97b72;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(249, 123, 114, 0.2);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.1) 50%,
      transparent 100%
    );
    z-index: 1;
    transition: left 0.5s ease;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: white;
    transform: scaleX(0);
    transform-origin: right;
    transition: transform 0.3s ease;
  }

  &:hover {
    background-color: #e06a5f;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(249, 123, 114, 0.3);
    border-color: #e06a5f;

    &::before {
      left: 100%;
    }

    &::after {
      transform: scaleX(1);
      transform-origin: left;
    }
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 12px 24px;
    font-size: 0.95rem;
  }
`;
