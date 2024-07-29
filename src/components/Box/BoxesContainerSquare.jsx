import React from "react";
import Box from "./Box";
import { ContainerSquare } from "./BoxesContainerSquare.styles";
import { useTranslation } from 'react-i18next';
import DataSquare from "./data/dataSquare";

export default function BoxesContainer() {
  const { t } = useTranslation();
  const boxesData = DataSquare(t);
  return (
    <ContainerSquare className="boxsquare">
      {boxesData.map((box) => (
        <Box
          key={box.id}
          title={box.title}
          description={box.description}
          imagen={box.image}
          height={167}
          width={261}
        />
      ))}
    </ContainerSquare>
  );
}
