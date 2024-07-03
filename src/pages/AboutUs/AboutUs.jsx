import React from "react";
import { Developer, ImageText } from "./AboutUs.styles";
import BoxesContainerRows from "../../components/Box/BoxesContainerRow";

const title = "Development and Design for the Digital Age";
const text = "We specialize in turning your ideas into innovative technological solutions. With an expert team in UX/UI, JavaScript, React, Python, and more, we take your project to the next level. From graphic design to backend development, we provide a comprehensive approach for the success of your digital business.";

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
