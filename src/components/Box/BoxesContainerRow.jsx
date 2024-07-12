import React from "react";
import { ContainerRow } from "./BoxesContainerRow.styles";
import Box from "./Box";

import { ReactComponent as Security } from "../../assets/icons/Security.svg";
import { ReactComponent as UXUI } from "../../assets/icons/UXUI.svg";
import { ReactComponent as GraphicDesign } from "../../assets/icons/GraphicDesign.svg";
import { ReactComponent as Circle } from "../../assets/icons/Circle.svg";

export default function BoxesContainerRows() {
  const boxesData = [
    {
      id: 1,
      title: "Company History",
      image: Security,
      description:
        "OpenGateHub leads in digital health, consistently adapting to new technologies. Our innovative, secure solutions enhance healthcare and management, ensuring data security and improved patient outcomes. We are dedicated to progress and excellence in the industry.",
    },
    {
      id: 2,
      title: "Mission and Core Values",
      image: UXUI,
      description:
       "At OpenGateHub, we innovate healthcare with technology, enhancing efficiency and well-being. Guided by values of excellence, client commitment, and data security, we drive progress in digital healthcare." },
    {
      id: 3,
      title: "Technologies",
      image: Circle,
      description:
        "At OpenGateHub, we leverage advanced technologies like UX/UI, React, Python, Flask, Django, Java, MySQL, and Docker to transform healthcare. Our solutions ensure secure, innovative, and efficient patient care and operations.",
    },
    {
      id: 4,
      title: "Commitment to Innovation",
      image: GraphicDesign,
      description:
      "At OpenGateHub, innovation is central to our mission in digital healthcare. We explore new technologies to enhance patient outcomes and operational efficiency, ensuring our solutions are impactful and adaptive to industry evolution.",
    },
  ];
  return (
    <ContainerRow>
      {boxesData.map((box) => (
        <Box
          key={box.id}
          title={box.title}
          description={box.description}
          imagen={box.image}
          buttonText="Learn More"
          height={380}
          width={260}
          marginLeftParagraph=""
          imageBottom={false}
        />
      ))}
    </ContainerRow>
  );
}
