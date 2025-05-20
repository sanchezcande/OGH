import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  CallToActionContainer,
  CallToActionTitle,
  CallToActionDescription,
  CallToActionButton,
} from "./CallToAction.styles";

const CallToActionBlock = ({ title, description, buttonText }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect(); 
          }
        });
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.disconnect();
      }
    };
  }, []);

  return (
    <CallToActionContainer ref={ref} className={isVisible ? "visible" : ""}>
      <CallToActionTitle>{title}</CallToActionTitle>
      <CallToActionDescription>{description}</CallToActionDescription>
      <CallToActionButton href="https://calendly.com/sanchezgcandelaria" target="_blank" rel="noopener noreferrer">
        {buttonText}
      </CallToActionButton>
    </CallToActionContainer>
  );
};

CallToActionBlock.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  buttonText: PropTypes.string.isRequired,
};

export default CallToActionBlock;
