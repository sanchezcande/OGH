import React from "react";
import useInViewDebounce from "./useInViewDebounce";
import useIsDesktop from "./../../Hooks/useIsDesktop"; 
import { AnimatedDiv } from "./AnimatedElement.styles";

const AnimatedElement = ({ children }) => {
  const isDesktop = useIsDesktop(); 
  const [ref, inView, hasExited] = useInViewDebounce(
    isDesktop ? "-10% 0px -10% 0px" : "100% 0px 100% 0px", 
    0.5,
    100
  );

  return (
    <AnimatedDiv ref={ref} inView={inView} hasExited={hasExited}>
      {children}
    </AnimatedDiv>
  );
};

export default AnimatedElement;
