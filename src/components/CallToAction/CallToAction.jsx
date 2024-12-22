import React from "react";
import PropTypes from "prop-types";
import {
  CallToActionContainer,
  CallToActionTitle,
  CallToActionDescription,
  CallToActionButton,
} from "./CallToAction.styles";

const CallToActionBlock = ({ title, description, buttonText }) => {
  return (
    <CallToActionContainer>
      <CallToActionTitle>{title}</CallToActionTitle>
      <CallToActionDescription>{description}</CallToActionDescription>
      <CallToActionButton onClick={() => window.location.href = "/contact-us"}>
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
