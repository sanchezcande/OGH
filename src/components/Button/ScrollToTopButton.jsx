import React, { useState, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa";
import styled from "styled-components";

const ScrollButton = styled.button`
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  background: #1f2937;
  color: #ffffff;
  border: none;
  padding: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transform: ${(props) =>
    props.$visible ? "translateY(0)" : "translateY(20px)"};
  transition: all 0.2s ease-in-out;
  pointer-events: ${(props) => (props.$visible ? "auto" : "none")};
  width: 44px;
  height: 44px;

  &:hover {
    background: #374151;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    bottom: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    padding: 10px;
    font-size: 16px;
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
