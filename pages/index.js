import {
  Container,
  Hero,
  Title,
  Subtitle,
  CTAButton,
  GradientOverlay,
  Highlight,
  Section,
  SectionTitle,
  PlanSteps,
  SectionText,
  ImageContainer,
  Glow,
} from "../src/styles/pagesStyles/HomePage.styles";
import { useTranslation } from "react-i18next";
import CallToActionBlock from "../src/components/CallToAction/CallToAction";
import Head from "next/head";
import dynamic from "next/dynamic";

const LottieAnimation = dynamic(
  () => import("../src/components/Animations/LottieAnimation"),
  {
    ssr: false,
  }
);

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
        <Hero>
          <GradientOverlay />
          {/* <ImageContainer>
            <LottieAnimation
              animationPath="/animations/home.json"
              width="100%"
              height="auto"
            />
          </ImageContainer> */}
          <Glow />
          <Title>
            <span className="animated">
              {t("heroAnimatedText.part1")}{" "}
              <span className="highlighted-word">
                {t("heroAnimatedText.highlight1")}
              </span>{" "}
              {t("heroAnimatedText.part2")}{" "}
              <span className="highlighted-word">
                {t("heroAnimatedText.highlight2")}
              </span>
              .
            </span>
          </Title>
          <Subtitle>{t("heroSubtitle")}</Subtitle>
          <CTAButton
            href="https://calendly.com/sanchezgcandelaria"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("ctaButton")}
          </CTAButton>
        </Hero>

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
          <PlanSteps>
            <li>
              <strong>1.</strong> {t("planSteps.step1")}
            </li>
            <li>
              <strong>2.</strong> {t("planSteps.step2")}
            </li>
            <li>
              <strong>3.</strong> {t("planSteps.step3")}
            </li>
          </PlanSteps>
        </Section>

        <HomeCallToAction />
      </Container>
    </>
  );
}
