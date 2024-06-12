import React from "react";
import { Container, Title } from "./HomePage.styles";
import Button from "../../components/Button/Button";
import theme from "../../styles/theme";


const HomePage = React.forwardRef((props, ref) => (
  <Container ref={ref}>
    <Title theme={ theme } >Bienvenido a la Página de Inicio</Title>
    {/* borrar el style */}
    <Button style={{ marginBottom: "1000px" }} >Click Me</Button>
  </Container>
));

export default HomePage;
