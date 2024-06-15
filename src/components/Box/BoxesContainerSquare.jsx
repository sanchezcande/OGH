import React from "react";
import Box from "./Box";
import { ContainerSquare } from "./BoxesContainerSquare.styles";
import { ReactComponent as Security } from "../../assets/icons/Security.svg";
import { ReactComponent as UXUI } from "../../assets/icons/UXUI.svg";
import { ReactComponent as GraphicDesign } from "../../assets/icons/GraphicDesign.svg";
import { ReactComponent as Circle } from "../../assets/icons/Circle.svg";

export default function BoxesContainer() {
  const boxesData = [
    {
      id: 1,
      title: "Frontend",
      image: Security,
      description:
        "Crafting engaging user interfaces with HTML, CSS, and JavaScript frameworks like React.",
    },
    {
      id: 2,
      title: "Backend & Database",
      image: UXUI,
      description:
        "Building robust server-side applications with scalable databases using technologies like Flask, Django, and MySQL.",
    },
    {
      id: 3,
      title: "UX/UI",
      image: Circle,
      description:
        "Designing intuitive and visually appealing user experiences with a focus on usability and interaction.",
    },
    {
      id: 4,
      title: "Graphic Design",
      image: GraphicDesign,
      description:
        "Creating stunning visuals and motion graphics that captivate and communicate your brand's message.",
    },
  ];
  return (
    <ContainerSquare>
      {boxesData.map((box) => (
        <Box
          key={box.id}
          title={box.title}
          description={box.description}
          imagen={box.image}
        />
      ))}
    </ContainerSquare>
  );
}
