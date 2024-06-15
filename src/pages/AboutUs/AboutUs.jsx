import React from "react";
import { Developer, ImageText } from "./AboutUs.styles";
import BoxesContainerRows from "../../components/Box/BoxesContainerRow";

const title = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
const text = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

const AboutUs = React.forwardRef((props, ref) => {
  return (
    <div ref={ref}>
      <ImageText>
        <Developer />
        <h1>
          {title} <span>{text}</span>
        </h1>
      </ImageText>
      <BoxesContainerRows />
    </div>
  );
});

export default AboutUs;
