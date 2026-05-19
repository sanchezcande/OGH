import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const ScrollRevealText = ({ text, className, style }) => {
  const containerRef = useRef(null);
  const stRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !text) return;

    // Small delay to ensure DOM is painted
    const raf = requestAnimationFrame(() => {
      const words = el.querySelectorAll(".sr-word");
      if (!words.length) return;

      stRef.current = ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        end: "top 25%",
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          const total = words.length;
          for (let i = 0; i < total; i++) {
            const wordStart = i / total;
            const wordEnd = (i + 1) / total;
            let wp = (p - wordStart) / (wordEnd - wordStart);
            wp = Math.max(0, Math.min(1, wp));
            words[i].style.opacity = String(0.12 + wp * 0.78);
          }
        },
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      if (stRef.current) stRef.current.kill();
    };
  }, [text]);

  const wordsArray = text ? text.split(" ") : [];

  return (
    <p ref={containerRef} className={className} style={{ ...style, textAlign: "center" }}>
      {wordsArray.map((word, i) => (
        <span
          key={i}
          className="sr-word"
          style={{
            display: "inline-block",
            marginRight: "0.3em",
            opacity: 0.12,
            color: "rgba(255,255,255,0.9)",
            willChange: "opacity",
          }}
        >
          {word}
        </span>
      ))}
    </p>
  );
};

export default ScrollRevealText;
