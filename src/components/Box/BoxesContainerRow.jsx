import React, {useState} from "react";
import { useTranslation } from 'react-i18next';
import { ContainerRow } from "./BoxesContainerRow.styles";
import Box from "./Box";
import { HighlightedWord } from "../../styles/pagesStyles/AboutUs.styles";
import company from "../../assets/images/Company.png";
import mission from "../../assets/images/Mission.png";
import techno from "../../assets/images/teamsvg.png";
import commitment from "../../assets/images/Commitment.png";

export default function BoxesContainerRows() {
  const { t } = useTranslation();
  const [openCardId, setOpenCardId] = useState(null);

  const handleBoxClick = (id) => {
    setOpenCardId(id === openCardId ? null : id);
  };

  const boxData = [
    {
      id: "history",
      title: t("companyHistoryTitle"),
      image: company,
      description: t("companyHistoryDescription"),
      expandableDescription1: t("companyHistoryExpandableDescription1"),
      expandableDescription2: t("companyHistoryExpandableDescription2"),
      expandableDescription3: t("companyHistoryExpandableDescription3"),
      expandableDescription4: t("companyHistoryExpandableDescription4"),
    },
    {
      id: "mission",
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
      expandableDescription1: t("missionAndCoreValuesExpandableDescription1"),
      expandableDescription2: t("missionAndCoreValuesExpandableDescription2"),
      expandableDescription3: t("missionAndCoreValuesExpandableDescription3"),
      expandableDescription4: t("missionAndCoreValuesExpandableDescription4"),
    },
    {
      id: "people",
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
      expandableDescription1: t("technologiesExpandableDescription1"),
      expandableDescription2: t("technologiesExpandableDescription2"),
      expandableDescription3: t("technologiesExpandableDescription3"),
      expandableDescription4: t("technologiesExpandableDescription4"),
    },
    {
      id: "innovation",
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
      expandableDescription1: t("commitmentToInnovationExpandableDescription1"),
      expandableDescription2: t("commitmentToInnovationExpandableDescription2"),
      expandableDescription3: t("commitmentToInnovationExpandableDescription3"),
      expandableDescription4: t("commitmentToInnovationExpandableDescription4"),
    },
  ];

  return (
    <ContainerRow>
      {boxData.map((item, index) => (
        <Box
          id={item.id}
          key={item.id}
          title={item.title}
          description={item.description}
          imagen={item.image}
          buttonText={t('learnMoreButtonText')}
          height={380}
          width={260}
          marginLeftParagraph=""
          imageBottom={false}
          handleBoxClick={() => handleBoxClick(item.id)}
          isOpen={item.id === openCardId}
          animationDelay={`${index * 0.15}s`}
        />
      ))}
    </ContainerRow>
  );
}
