import { useTranslation } from 'react-i18next';
import { ReactComponent as Security } from "../../../assets/icons/Security.svg";
import { ReactComponent as UXUI } from "../../../assets/icons/UXUI.svg";
import { ReactComponent as GraphicDesign } from "../../../assets/icons/GraphicDesign.svg";
import { ReactComponent as Circle } from "../../../assets/icons/Circle.svg";
import companyHistory from "../../../assets/images/companyHistory.png";
import missionAndCoreValues from "../../../assets/images/coreValues.png";
import technologies from "../../../assets/images/technologies.png";
import commitmentToInnovation from "../../../assets/images/innovation.png";

const DataRow = () => {
  const { t } = useTranslation();

  return[
  {
    id: 1,
    title: t("companyHistoryTitle"),
    image: Security,
    description: t("companyHistoryDescription"),
    expandableImage: companyHistory,
    expandableDescription: (
      <>
        {t("companyHistoryExpandableDescription1")}
          <br />
          <br />
          {t("companyHistoryExpandableDescription2")}
          <br />
          <br />
          {t("companyHistoryExpandableDescription3")}
          <br />
          <br />
          {t("companyHistoryExpandableDescription4")}
      </>
    ),
  },
  {
    id: 2,
    title: t("missionAndCoreValuesTitle"),
    image: UXUI,
    description: t("missionAndCoreValuesDescription"),
      expandableImage: missionAndCoreValues,
    expandableDescription: (
      <>
        {t("missionAndCoreValuesExpandableDescription1")}
          <br />
          <br />
          {t("missionAndCoreValuesExpandableDescription2")}
          <br />
          <br />
          {t("missionAndCoreValuesExpandableDescription3")}
          <br />
          <br />
          {t("missionAndCoreValuesExpandableDescription4")}
      </>
    ),
  },
  {
    id: 3,
    title: t("technologiesTitle"),
    image: Circle,
    description: t("technologiesDescription"),
      expandableImage: technologies,
    expandableDescription: (
      <>
       {t("technologiesExpandableDescription1")}
          <br />
          <br />
          {t("technologiesExpandableDescription2")}
          <br />
          <br />
          {t("technologiesExpandableDescription3")}
          <br />
          <br />
          {t("technologiesExpandableDescription4")}
      </>
    ),
  },
  {
    id: 4,
    title: t("commitmentToInnovationTitle"),
    image: GraphicDesign,
    description: t("commitmentToInnovationDescription"),
      expandableImage: commitmentToInnovation,
    expandableDescription: (
      <>
        {t("commitmentToInnovationExpandableDescription1")}
          <br />
          <br />
          {t("commitmentToInnovationExpandableDescription2")}
          <br />
          <br />
          {t("commitmentToInnovationExpandableDescription3")}
          <br />
          <br />
          {t("commitmentToInnovationExpandableDescription4")}
      </>
    ),
  },
];
};
export default DataRow;
