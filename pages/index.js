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
  InteractiveCircleContainer,
  FloatingBlob,
  PlanSteps,
  SectionText,
  ImageContainer,
  Glow,
  PlanSection,
} from "../src/styles/pagesStyles/HomePages.styles";
import { useTranslation } from "react-i18next";
import CallToActionBlock from "../src/components/CallToAction/CallToAction";
import Head from "next/head";
import dynamic from "next/dynamic";
import InteractiveInvertCircle from "../src/components/Animations/InteractiveCircle";
import { InView } from "../src/components/InView/InView";

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

  const parseHighlightedText = (text) => {
    if (!text) return [];
    const parts = text.split(/<highlight>|<\/highlight>/);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <span key={index} className="highlighted-word">{part}</span>;
      }
      return part;
    });
  };

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
        <FloatingBlob />
        <Hero>
          <GradientOverlay />
          {/* <ImageContainer>
            <LottieAnimation
              animationPath="/animations/home.json"
              width="100%"
              height="auto"
            />
          </ImageContainer> */}
          {/* ⬅ este! */}

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
          <Subtitle>
            {t("heroSubtitle")}
          </Subtitle>
          <CTAButton
            href="https://calendly.com/sanchezgcandelaria"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("ctaButton")}
          </CTAButton>
        </Hero>
        <InteractiveCircleContainer>
          <InteractiveInvertCircle />
          <Section>
            <SectionTitle style={{"--i": 0}}>
              {parseHighlightedText(t("problemTitle"))}
            </SectionTitle>
            <SectionText>{t("problemText")}</SectionText>
          </Section>

          <Section>
            <SectionTitle style={{"--i": 1}}>
              {parseHighlightedText(t("weGetYouTitle"))}
            </SectionTitle>
            <SectionText>{t("weGetYouText")}</SectionText>
          </Section>
        </InteractiveCircleContainer>
        <PlanSection>
          <SectionTitle style={{"--i": 2}}>
            {t("planTitle")}
          </SectionTitle>
          <InView>
            {(isInView) => (
              <PlanSteps className={isInView ? 'in-view' : ''}>
                <li style={{"--i": 0}}>
                  <strong>1.</strong> {t("planSteps.step1")}
                </li>
                <li style={{"--i": 1}}>
                  <strong>2.</strong> {t("planSteps.step2")}
                </li>
                <li style={{"--i": 2}}>
                  <strong>3.</strong> {t("planSteps.step3")}
                </li>
              </PlanSteps>
            )}
          </InView>
        </PlanSection>

        <HomeCallToAction />
      </Container>
    </>
  );
}
