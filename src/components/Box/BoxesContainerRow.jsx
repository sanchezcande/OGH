import React, {useState} from "react";
import { ContainerRow } from "./BoxesContainerRow.styles";
import Box from "./Box";
import data from "./data";

export default function BoxesContainerRows() {
  const [openCardId, setOpenCardId] = useState(null);

  const handleBoxClick = (id) => {
    setOpenCardId(id === openCardId ? null : id);
  };
    return (
    <ContainerRow>
      {data.map((box) => (
        <Box
          id={box.id}
          key={box.id}
          title={box.title}
          description={box.description}
          imagen={box.image}
          buttonText="Learn More"
          height={380}
          width={260}
          marginLeftParagraph=""
          imageBottom={false}
          handleBoxClick={() => handleBoxClick(box.id)}
          isOpen={box.id === openCardId}
        />
      ))}
    </ContainerRow>
  );
}
