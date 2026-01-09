"use client";
import { useEffect, useRef, useState } from "react";

export function InView({ children, onInView }) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          onInView?.(true);
        }
      },
      { threshold: 0.2 },
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [onInView]);

  return (
    <div ref={ref}>
      {typeof children === "function" ? children(isInView) : children}
    </div>
  );
}
