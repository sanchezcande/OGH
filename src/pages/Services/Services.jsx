import React from "react";
import BoxesContainer from "../../components/Box/BoxesContainerSquare";
import { Developer, Container } from "./Services.styles";

const Services = React.forwardRef((props, ref) => {
  return (
    <Container ref={ref}>
      <BoxesContainer/>
      <Developer/>
    </Container>
  );
});

export default Services;
