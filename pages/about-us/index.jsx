import React from "react";
import { Developer, ImageText, Container } from "./AboutUs.styles";
import BoxesContainerRows from "../../src/components/Box/BoxesContainerRow";
import developer1 from '../../src/assets/images/developer1.png';
import { useTranslation } from "react-i18next";

const AboutUs = React.forwardRef((props, ref) => {
  const { t } = useTranslation();
  return (
    <Container ref={ref}>
      <ImageText>
        <Developer src={developer1} alt="dev1" />
        <h1>
        {t("aboutUsTitle")} <span>{t("aboutUsText")}</span>
        </h1>
      </ImageText>
      <BoxesContainerRows />
    </Container>
  );
});

export default AboutUs;
