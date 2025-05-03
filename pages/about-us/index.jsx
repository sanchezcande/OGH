import React, { useEffect, useRef } from "react";
import { ImageText, Container } from "../../src/styles/pagesStyles/AboutUs.styles";
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
      { threshold: 0.2 } 
    );

    if (imageRef.current) observer.observe(imageRef.current);
    if (textRef.current) observer.observe(textRef.current);

    return () => {
      if (imageRef.current) observer.unobserve(imageRef.current);
      if (textRef.current) observer.unobserve(textRef.current);
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
          <Image src="/images/AboutUs.png" width={250} height={250}   layout="responsive" 
          />
        </div>


        <div ref={textRef}>
          <h1>
            {t("aboutUsTitle")} <span>{t("aboutUsText")}</span>
          </h1>
        </div>
      </ImageText>
      <BoxesContainerRows />
      <AboutUsCallToAction />
    </Container>
  );
});

export default AboutUs;
