import React from "react";
import { Container, Title, Image, Title2 } from "./HomePage.styles";

const HomePage = React.forwardRef((props, ref) => (
  <Container ref={ref}>
    <Image />
    <Title> <span>We are</span> OpenGateHub</Title>
    <Title2>
      Specialized in <span>Web & MobileApp Development</span>, crafting
      innovative digital solution <span>for business</span>
    </Title2>
  </Container>
));

export default HomePage;
