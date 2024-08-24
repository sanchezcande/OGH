import React from "react";
import { useInView, animated, useSpring } from "@react-spring/web";

export const buildInteractionObserverThreshold = (count = 100) => {
  const threshold = [];
  const parts = 1 / count;

  for (let i = 0; i <= count; i++) {
    threshold.push(parseFloat((parts * i).toFixed(2)));
  }

  return threshold;
};

const AnimatedElement = ({ children }) => {
  const [springs, api] = useSpring(() => ({
    opacity: 0,
    y: 80,
    config: { tension: 220, friction: 120 },
  }));

  const [ref, inView] = useInView({
    rootMargin: "-45% 0px -45% 0px",
    threshold: buildInteractionObserverThreshold(),
  });

  React.useEffect(() => {
    if (inView) {
      api.start({ opacity: 1, y: 0 });
    } else {
      api.start({ opacity: 0, y: 80 }); 
    }
  }, [inView, api]);

  return (
    <animated.div ref={ref} style={springs}>
      {children}
    </animated.div>
  );
};

export default AnimatedElement;
