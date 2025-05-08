import React, { useEffect, useRef } from "react";
import {
  ImageText,
  Container,
  HighlightedWord,
} from "../../src/styles/pagesStyles/AboutUs.styles";
import BoxesContainerRows from "../../src/components/Box/BoxesContainerRow";
import { useTranslation } from "react-i18next";
import CallToActionBlock from "../../src/components/CallToAction/CallToAction";
import Head from "next/head";
import Image from "next/image";

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
        <meta property="og:image" content="/logo/Reducido4.png" />
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
            src="/images/AboutUs.png"
            width={250}
            height={250}
            layout="responsive"
            alt={t("heroAlt") || "OpenGateHub Team"}
            priority // Consider adding priority if this is LCP
          />
        </div>

        <div ref={textRef}>
          <h1>
            {t("aboutUsTitle_part1")}
            <HighlightedWord className="animate">
              {t("aboutUsTitle_highlight")}
            </HighlightedWord>
            {/* Add part2 if it exists: {t("aboutUsTitle_part2")} */}
            <span>{t("aboutUsText")}</span>
          </h1>
        </div>
      </ImageText>
      <BoxesContainerRows />
      <AboutUsCallToAction />
    </Container>
  );
});

AboutUs.displayName = "AboutUs"; // Add display name for forwardRef components

export default AboutUs;
