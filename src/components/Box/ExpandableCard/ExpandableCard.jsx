import { useState } from "react";
import { Container, CardContent, CloseButton, CardTitle, CardSection, CardDescription, ImageContainer } from "./ExpandableCard.styles";
import Data from "../data/dataRow";
import CloseSvg from "../../../assets/icons/closeSvg"; 
import Image from "next/image";

function ExpandableCard({ closeCard, id }) {
  const data = Data(); 
  const [fadeOut, setFadeOut] = useState(false);
  const handleClose = () => {
    setFadeOut(true);
    setTimeout(() => {
      closeCard();
    }, 500);
  };

  const card = data.find((item) => item.id === id);

  return (
    <Container fadeOut={fadeOut} >
      <div>
        <CardContent>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <CloseButton onClick={handleClose}>
              <svg
                key="exclude"
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <CloseSvg />
              </svg>
            </CloseButton>
            <CardTitle>{card.title}</CardTitle>
          </div>
          <div style={{ overflowY: "auto"}}>
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
