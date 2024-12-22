import React from "react";
import { ImageText, Container } from "../../src/styles/pagesStyles/AboutUs.styles";
import BoxesContainerRows from "../../src/components/Box/BoxesContainerRow";
import { useTranslation } from "react-i18next";
import modeloHtml from "../../src/assets/images/modeloHtml.png";
import Image from "next/image";
import CallToActionBlock from "../../src/components/CallToAction/CallToAction";
import Head from "next/head";

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
  return (
    <Container ref={ref}>
      <Head>
        <title> {t("aboutUs")}</title>
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
        <div className="relative w-full m-auto">
          <Image
            width={1000}
            height={550}
            src={modeloHtml}
            alt="Desarrollador web profesional leyendo sobre nuevas tecnologías."
          />
        </div>
        <h1>
          {t("aboutUsTitle")} <span>{t("aboutUsText")}</span>
        </h1>
      </ImageText>
      <BoxesContainerRows />
      <AboutUsCallToAction />
    </Container>
  );
});

export default AboutUs;
