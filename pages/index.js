import { Container, Title, Title2, ImageContainer } from "../src/styles/pagesStyles/HomePage.styles";
import { useTranslation } from "react-i18next";
import Head from "next/head";
import CallToActionBlock from "../src/components/CallToAction/CallToAction";
import dynamic from 'next/dynamic';

const LottieAnimation = dynamic(() => import('../src/components/Animations/LottieAnimation'), {
  ssr: false,
});


export async function getServerSideProps() {
  return {
    props: {},
  };
}
export const HomeCallToAction = () => {
  const { t } = useTranslation();
  const callToAction = t("homeCallToAction", { returnObjects: true });

  return (
    <CallToActionBlock
      title={callToAction.title}
      description={callToAction.description}
      buttonText={callToAction.buttonText}
    />
  );
};

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>OpenGateHub</title>
        <meta name="description" content="OpenGateHub" />
        <link rel="canonical" href="https://opengatehub.com/" />
        <meta property="og:title" content={t("OpenGateHub")} />
        <meta property="og:description" content={t("pageDescription")} />
        <meta property="og:url" content="https://opengatehub.com/" />
        <meta
          name="keywords"
          content="OpenGateHub, Open Gate Hub, Open GateHub, software develop, web develop, páginas web"
        />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
      </Head>

      <Container>
        <ImageContainer>
        <LottieAnimation animationPath="/animations/home.json" width="100%" height="auto" />

        </ImageContainer>
        <Title>
          <span>{t("weAre")}</span> OpenGateHub
        </Title>
        <Title2>
          {t("specializedIn")} <span>{t("webAndMobileApp")}</span>,{" "}
          {t("crafting")} {t("innovativeSolution")}{" "}
          <span>{t("forBusiness")}</span>
        </Title2>
        <HomeCallToAction />
      </Container>
    </>
  );
}
