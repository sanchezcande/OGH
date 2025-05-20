import { useEffect, useRef, useState } from "react";
import { InteractiveCircle } from "../../styles/pagesStyles/InteractiveCircle.styles";

export default function InteractiveInvertCircle() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);
  const lastValidPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const isOverContainer = 
        e.clientX >= rect.left && 
        e.clientX <= rect.right && 
        e.clientY >= rect.top && 
        e.clientY <= rect.bottom;

      if (isOverContainer) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        lastValidPosition.current = { x, y };
        setCoords({ x, y });
        setIsVisible(true);
      } else {
        // When leaving the container, keep the last position for the fade-out
        setCoords(lastValidPosition.current);
        setIsVisible(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      <InteractiveCircle 
        style={{ 
          left: `${coords.x}px`, 
          top: `${coords.y}px`,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }} 
      />
    </div>
  );
}
