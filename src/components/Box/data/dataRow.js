import { useTranslation } from 'react-i18next';
import companyHistory from "../../../assets/images/companyHistory.png";
import missionAndCoreValues from "../../../assets/images/coreValues.png";
import technologies from "../../../assets/images/team.jpg";
import commitmentToInnovation from "../../../assets/images/innovation.png";
import company from "../../../assets/images/Company.png";
import techno from "../../../assets/images/teamsvg.png";
import commitment from "../../../assets/images/Commitment.png";
import mission from "../../../assets/images/Mission.png";
import { HighlightedWord } from "../../../styles/pagesStyles/AboutUs.styles";

const DataRow = () => {
  const { t } = useTranslation();

  return [
    {
      id: 1,
      title: t("companyHistoryTitle"),
      image: company,
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
      title: (
        <>
          {t("missionAndCoreValuesTitle_part1")}
          <HighlightedWord className="animate">
            {t("missionAndCoreValuesTitle_highlight")}
          </HighlightedWord>
        </>
      ),
      image: mission,
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
      title: (
        <>
          {t("technologiesTitle_part1")}
          <HighlightedWord className="animate">
            {t("technologiesTitle_highlight")}
          </HighlightedWord>
        </>
      ),
      image: techno,
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
      title: (
        <>
          {t("commitmentToInnovationTitle_part1")}
          <HighlightedWord className="animate">
            {t("commitmentToInnovationTitle_highlight")}
          </HighlightedWord>
        </>
      ),
      image: commitment,
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
