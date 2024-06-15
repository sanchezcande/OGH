// AnimatedElement.jsx
import React from 'react';
import { useInView, animated } from '@react-spring/web';

export const buildInteractionObserverThreshold = (count = 100) => {
  const threshold = [];
  const parts = 1 / count;

  for (let i = 0; i <= count; i++) {
    threshold.push(parseFloat((parts * i).toFixed(2)));
  }

  return threshold;
};

const AnimatedElement = ({ children }) => {
  const [ref, springs] = useInView(
    () => ({
      from: {
        opacity: 0,
        y: 80,
      },
      to: {
        opacity: 1,
        y: 0,
      },
    }),
    {
      rootMargin: '-45% 0px -45% 0px',
      threshold: buildInteractionObserverThreshold(),
    }
  );

  return (
    <animated.div ref={ref} style={springs}>
      {children}
    </animated.div>
  );
};

export default AnimatedElement;
