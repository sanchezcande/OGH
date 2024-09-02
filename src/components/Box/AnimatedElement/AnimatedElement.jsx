import React from "react";
import useInViewDebounce from "./useInViewDebounce"; 
import { AnimatedDiv } from "./AnimatedElement.styles";

const AnimatedElement = ({ children }) => {
  const [ref, inView, hasExited] = useInViewDebounce("-10% 0px -10% 0px", 0.5, 100);

  return (
    <AnimatedDiv ref={ref} inView={inView} hasExited={hasExited}>
      {children}
    </AnimatedDiv>
  );
};

export default AnimatedElement;
