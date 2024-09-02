import { useEffect, useRef, useState } from "react";

const useInViewDebounce = (rootMargin = "0px", threshold = 0.5, delay = 100) => {
  const [inView, setInView] = useState(false);
  const [hasExited, setHasExited] = useState(false);
  const ref = useRef(null);
  const timeoutId = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timeoutId.current);

        if (entry.isIntersecting) {
          timeoutId.current = setTimeout(() => {
            if (!inView) {
              setInView(true);
              setHasExited(false);
            }
          }, delay);
        } else {
          timeoutId.current = setTimeout(() => {
            if (inView) {
              setInView(false);
              setHasExited(true);
            }
          }, delay);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      clearTimeout(timeoutId.current);
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [inView, rootMargin, threshold, delay]);

  return [ref, inView, hasExited];
};

export default useInViewDebounce;
