
import {
  Container,
  Title,
  Subtitle,
  Section,
  SectionTitle,
  SectionText,
  CTAButton,
  ImageContainer,
} from "../src/styles/pagesStyles/HomePage.styles";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import Head from "next/head";
import CallToActionBlock from "../src/components/CallToAction/CallToAction";
import cyberSecurity from "../public/cyberSecurity.png";

export async function getServerSideProps() {
  return { props: {} };
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
        <Image
            src={cyberSecurity}
            alt="Cyber Security by Open Gate Hub software develop, webapps, paginas web"
            layout="intrinsic"
            width={500}
            height={300}
          />
        </ImageContainer>

        <Title>{t("heroTitle")}</Title>
        <Subtitle>{t("heroSubtitle")}</Subtitle>

        <Section>
          <SectionTitle>{t("problemTitle")}</SectionTitle>
          <SectionText>{t("problemText")}</SectionText>
        </Section>

        <Section>
          <SectionTitle>{t("weGetYouTitle")}</SectionTitle>
          <SectionText>{t("weGetYouText")}</SectionText>
        </Section>

        <Section>
          <SectionTitle>{t("planTitle")}</SectionTitle>
          <SectionText>{t("planSteps")}</SectionText>
        </Section>

        <HomeCallToAction />
      </Container>
    </>
  );
}
