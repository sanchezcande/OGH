import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  CallToActionContainer,
  CallToActionTitle,
  CallToActionDescription,
  CallToActionButton,
} from "./CallToAction.styles";
import { motion } from "framer-motion";

const CallToActionBlock = ({
  title,
  description,
  buttonText,
  highlightWord,
}) => {
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
      { threshold: 0.1 },
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

  // Function to format title with optional word highlighting
  const formatTitle = (title, highlightWord) => {
    if (!title) return "";

    // If no highlightWord is provided, highlight the first word (default behavior)
    if (!highlightWord) {
      const words = title.split(" ");
      if (words.length <= 1) return title;

      return (
        <>
          <span>{words[0]}</span> {words.slice(1).join(" ")}
        </>
      );
    }

    // If highlightWord is provided, find and highlight that specific word
    const words = title.split(" ");
    const highlightIndex = words.findIndex(
      (word) =>
        word.toLowerCase().replace(/[^a-z0-9]/g, "") ===
        highlightWord.toLowerCase().replace(/[^a-z0-9]/g, ""),
    );

    if (highlightIndex === -1) {
      // If word not found, fall back to highlighting first word
      return (
        <>
          <span>{words[0]}</span> {words.slice(1).join(" ")}
        </>
      );
    }

    // Separate the word from trailing punctuation
    const wordWithPunctuation = words[highlightIndex];
    const punctuationMatch = wordWithPunctuation.match(/^(.+?)([.,;:!?]+)$/);
    const wordOnly = punctuationMatch ? punctuationMatch[1] : wordWithPunctuation;
    const punctuation = punctuationMatch ? punctuationMatch[2] : "";

    return (
      <>
        {words.slice(0, highlightIndex).join(" ")}
        {highlightIndex > 0 && " "}
        <span>{wordOnly}</span>{punctuation}
        {highlightIndex < words.length - 1 && " "}
        {words.slice(highlightIndex + 1).join(" ")}
      </>
    );
  };

  return (
    <CallToActionContainer ref={ref} className={isVisible ? "visible" : ""}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <CallToActionTitle>
          {formatTitle(title, highlightWord)}
        </CallToActionTitle>
        <CallToActionDescription>{description}</CallToActionDescription>
        <CallToActionButton
          href="https://calendly.com/sanchezgcandelaria"
          target="_blank"
          rel="noopener noreferrer"
        >
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
  highlightWord: PropTypes.string, // Optional prop for highlighting specific words
};

export default CallToActionBlock;
