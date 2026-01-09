import React, { useState, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa";
import styled from "styled-components";

const ScrollButton = styled.button`
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  background: linear-gradient(135deg, #f97b72 0%, #e85d64 100%);
  color: white;
  border: none;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(249, 123, 114, 0.3);
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transform: ${(props) =>
    props.$visible ? "translateY(0)" : "translateY(20px)"};
  transition: all 0.3s ease-in-out;
  pointer-events: ${(props) => (props.$visible ? "auto" : "none")};
  width: 56px;
  height: 56px;

  &:hover {
    background: linear-gradient(135deg, #e06a5f 0%, #d45a61 100%);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(249, 123, 114, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    bottom: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    padding: 12px;
    font-size: 18px;
  }
`;

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  return (
    <ScrollButton onClick={scrollToTop} $visible={isVisible}>
      <FaArrowUp />
    </ScrollButton>
  );
};

export default ScrollToTopButton;
