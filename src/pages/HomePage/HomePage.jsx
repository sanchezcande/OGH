import React from "react";
import { useTranslation } from 'react-i18next';
import { Container, Title, Image, Title2 } from "./HomePage.styles";

const HomePage = React.forwardRef((props, ref) => {
  const { t } = useTranslation(); 

  return (
    <Container ref={ref}>
      <Image />
      <Title>
        <span>{t("weAre")}</span> OpenGateHub
      </Title>
      <Title2>
        {t("specializedIn")} <span>{t("webAndMobileApp")}</span>, {t("crafting")}
        {t("innovativeSolution")} <span>{t("forBusiness")}</span>
      </Title2>
    </Container>
  );
});

export default HomePage;
