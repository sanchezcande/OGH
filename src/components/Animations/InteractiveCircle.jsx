import { useEffect, useRef, useState } from "react";
import { InteractiveCircle } from "../../styles/pagesStyles/InteractiveCircle.styles";

export default function InteractiveInvertCircle() {
  const [coords, setCoords] = useState({ x: -9999, y: -9999 });
  const requestRef = useRef();

  useEffect(() => {
    const handleMouseMove = (e) => {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(() => {
        setCoords({ x: e.clientX, y: e.clientY });
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return <InteractiveCircle style={{ left: `${coords.x}px`, top: `${coords.y}px` }} />;
}
