import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  CallToActionContainer,
  CallToActionTitle,
  CallToActionDescription,
  CallToActionButton,
} from "./CallToAction.styles";
import { motion } from "framer-motion";

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

  // Function to wrap the first word in a span
  const formatTitle = (title) => {
    if (!title) return "";
    const words = title.split(" ");
    if (words.length <= 1) return title;
    
    return (
      <>
        <span>{words[0]}</span> {words.slice(1).join(" ")}
      </>
    );
  };

  return (
    <CallToActionContainer ref={ref} className={isVisible ? "visible" : ""}>
      <CallToActionTitle>{formatTitle(title)}</CallToActionTitle>
      <CallToActionDescription>{description}</CallToActionDescription>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <CallToActionButton href="https://calendly.com/sanchezgcandelaria" target="_blank" rel="noopener noreferrer">
          {buttonText}
        </CallToActionButton>
      </motion.div>
    </CallToActionContainer>
  );
};

CallToActionBlock.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  buttonText: PropTypes.string.isRequired,
};

export default CallToActionBlock;
