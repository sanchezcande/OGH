import React from "react";
import { Container, Title } from "./HomePage.styles";
import Button from "../../components/Button/Button";

const HomePage = React.forwardRef((props, ref) => (
  <Container ref={ref}>
    <Title>Bienvenido a la Página de Inicio</Title>
    <Button>Click Me</Button>
  </Container>
));

export default HomePage;
