import { useState } from "react";
import {
  Container,
  CardContent,
  CloseButton,
  CardTitle,
  CardSection,
  CardDescription,
  ImageContainer,
} from "./ExpandableCard.styles";
import Data from "../data/dataRow";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from '@fortawesome/free-solid-svg-icons';


function ExpandableCard({ closeCard, id }) {
  const data = Data();
  const [fadeOut, setFadeOut] = useState(false);

  const idMapping = {
    "history": 1,
    "mission": 2,
    "people": 3,
    "innovation": 4,
  };
  const numericId = typeof id === 'string' ? idMapping[id] : id;

  const handleClose = () => {
    setFadeOut(true);
    setTimeout(() => {
      closeCard();
    }, 500);
  };

  const card = data.find((item) => item.id === numericId);

  if (!card) {
    console.error(`ExpandableCard: Card with id ${id} (numeric: ${numericId}) not found.`);
    return null;
  }

  return (
    <Container fadeOut={fadeOut}>
      <div>
        <CardContent>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <CloseButton onClick={handleClose}>
            <FontAwesomeIcon icon={faXmark} size="lg"  />
            </CloseButton>
            <CardTitle>{card.title}</CardTitle>
          </div>
          <div style={{ overflowY: "auto" }}>
            <ImageContainer>
              <Image
                layout="responsive"
                width={16}
                height={9}
                placeholder="blur"
                alt={card.title}
                src={card.expandableImage}
              />
            </ImageContainer>
            <CardSection>
              <CardDescription>{card.expandableDescription}</CardDescription>
            </CardSection>
          </div>
        </CardContent>
      </div>
    </Container>
  );
}

export default ExpandableCard;
