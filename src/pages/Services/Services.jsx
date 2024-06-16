import React, { useState, useEffect } from "react";
import BoxesContainer from "../../components/Box/BoxesContainerSquare";
import { Developer, Container } from "./Services.styles";

const Services = React.forwardRef((props, ref) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Container ref={ref}>
      {isMobile ? (
        <>
          <Developer />
          <BoxesContainer />
        </>
      ) : (
        <>
          <BoxesContainer />
          <Developer />
        </>
      )}
    </Container>
  );
});

export default Services;
