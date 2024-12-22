import React from "react";
import { ImageText, Container } from "./AboutUs.styles";
import BoxesContainerRows from "../../src/components/Box/BoxesContainerRow";
import { useTranslation } from "react-i18next";
import modeloHtml from "../../src/assets/images/modeloHtml.png";
import Image from "next/image";
import CallToActionBlock from "../../src/components/CallToAction/CallToAction";

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
