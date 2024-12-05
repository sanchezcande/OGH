import React from "react";
import { Developer, ImageText, Container } from "./AboutUs.styles";
import BoxesContainerRows from "../../src/components/Box/BoxesContainerRow";
import developer1 from "../../src/assets/images/developer1.png";
import { useTranslation } from "react-i18next";
import modeloHtml from "../../src/assets/images/modeloHtml.png";
import Image from "next/image";

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
            alt="Desarrollador web profesional leyendo sobre nuevas tecnologías. "
          />
        </div>
        <h1>
          {t("aboutUsTitle")} <span>{t("aboutUsText")}</span>
        </h1>
      </ImageText>
      <BoxesContainerRows />
    </Container>
  );
});

export default AboutUs;
