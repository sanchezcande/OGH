import React from "react";
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { Container, Title, Image, Title2 } from "./HomePage.styles";

const HomePage = React.forwardRef((props, ref) => {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>OpenGateHub</title>
        <meta name="description" content={t("pageDescription")} />
        <link rel="canonical" href="https:/opengatehub.com/" />
        <meta property="og:title" content={t("OpenGateHub")} />
        <meta property="og:description" content={t("pageDescription")} />
        <meta property="og:url" content="https://opengatehub.com/" />
        <meta name="keywords" content="OpenGateHub, Open Gate Hub, Open GateHub, software develop, web develop, páginas web" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
      </Helmet>

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
    </>
  );
});

export default HomePage;
