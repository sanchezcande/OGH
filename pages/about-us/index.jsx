import React, { useEffect, useRef } from "react";
import {
  ImageText,
  Container,
  HighlightedWord,
} from "../../src/styles/pagesStyles/AboutUs.styles";
import { useTranslation } from "react-i18next";
import CallToActionBlock from "../../src/components/CallToAction/CallToAction";
import Head from "next/head";
import Image from "next/image";
import AboutTimeline from "../../src/components/Timeline/AboutTimeline";

export const AboutUsCallToAction = () => {
  const { t } = useTranslation();
  const callToAction = t("aboutUsCallToAction", { returnObjects: true });

  return (
    <CallToActionBlock
      title={callToAction.title}
      description={callToAction.description}
      buttonText={callToAction.buttonText}
    />
  );
};

const AboutUs = React.forwardRef((props, ref) => {
  const { t } = useTranslation();
  const imageRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 } // Lowered threshold for earlier animation trigger
    );

    const currentImageRef = imageRef.current;
    const currentTextRef = textRef.current;

    if (currentImageRef) observer.observe(currentImageRef);
    if (currentTextRef) observer.observe(currentTextRef);

    return () => {
      if (currentImageRef) observer.unobserve(currentImageRef);
      if (currentTextRef) observer.unobserve(currentTextRef);
    };
  }, []);

  return (
    <Container ref={ref}>
      <Head>
        <title>About Us - OpenGateHub</title>
        <meta
          name="description"
          content="Learn about OpenGateHub, our mission, values, and the passionate team driving innovation in digital solutions. Together, we create meaningful change."
        />
        <link rel="canonical" href="https://opengatehub.com/about-us" />
        <meta property="og:title" content="About Us - OpenGateHub" />
        <meta
          property="og:description"
          content="Discover how OpenGateHub builds bridges to help your ideas lead the digital future. Our team is committed to delivering tailored solutions."
        />
        <meta property="og:url" content="https://opengatehub.com/about-us" />
        <meta property="og:image" content="/images/og-about-us.png" />
        <meta
          name="keywords"
          content="OpenGateHub, About Us, Mission, Values, Digital Transformation, Technology Solutions, Innovation"
        />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <ImageText>
        <div className="image-container" ref={imageRef}>
          <Image
            src="/images/Cande.png"
            width={250}
            height={250}
            quality={100}
            alt={t("heroAlt") || "OpenGateHub Team"}
            priority
          />
          
          <div className="founder-info">
            <h3 className="founder-name">Candelaria Sanchez</h3>
            <p className="founder-role">Co-founder & CTO</p>
          </div>
        </div>

        <div ref={textRef}>
          <h1>
            {t("aboutUsTitle_part1")}
            <HighlightedWord className="animate">
              {t("aboutUsTitle_highlight")}
            </HighlightedWord>
          </h1>
          <h2 className="subtitle">{t("aboutUsSubtitle")}</h2>
          <p>
            {t("aboutUsText")}
            {t("aboutUsLastLine")}
            <span className="bold-text">{t("aboutUsTextBold")}</span>
          </p>
        </div>
      </ImageText>

      <AboutTimeline />

      <AboutUsCallToAction />
    </Container>
  );
});

AboutUs.displayName = "AboutUs";

export default AboutUs;
