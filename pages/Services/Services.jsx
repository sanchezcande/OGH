import React, { useState, useEffect } from "react";
import BoxesContainer from "../../../src/components/Box/BoxesContainerSquare";
import { Developer, Container, ContainerContainer } from "./Services.styles";
import developer from "../../assets/images/developer.png";

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
    <ContainerContainer>
    <Container ref={ref}>
      {isMobile ? (
        <>
          <Developer src={developer} alt="dev"  />
          <BoxesContainer />
        </>
      ) : (
        <>
          <BoxesContainer />
          <Developer src={developer} alt="dev"  />
        </>
      )}
    </Container>
    </ContainerContainer>
  );
});

export default Services;
