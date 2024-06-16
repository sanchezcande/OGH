import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';

const ScrollButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  background-color: rgba(21, 62, 108, 0.34);
  color: white;
  border: 2px solid #0034ee;
  padding: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => (props.visible ? 1 : 0)};
  transition: opacity 0.3s ease-in-out;
  pointer-events: ${props => (props.visible ? 'auto' : 'none')};

  svg {
    color: #0034ee;
    transition: color 0.3s;
  }
  &:hover {
    background-color: #0034EE;

    svg {
      color: white;
    }
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
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <ScrollButton onClick={scrollToTop} visible={isVisible}>
      <FontAwesomeIcon icon={faArrowUp} />
    </ScrollButton>
  );
};

export default ScrollToTopButton;