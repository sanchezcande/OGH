import React from "react";
import { Developer, ImageText } from "./AboutUs.styles";
import BoxesContainerRows from "../../components/Box/BoxesContainerRow";
import developer1 from '../../assets/images/developer1.png';
import { useTranslation } from "react-i18next";

const AboutUs = React.forwardRef((props, ref) => {
  const { t } = useTranslation();
  return (
    <div ref={ref}>
      <ImageText>
        <Developer src={developer1} alt="dev1" />
        <h1>
        {t("aboutUsTitle")} <span>{t("aboutUsText")}</span>
        </h1>
      </ImageText>
      <BoxesContainerRows />
    </div>
  );
});

export default AboutUs;
