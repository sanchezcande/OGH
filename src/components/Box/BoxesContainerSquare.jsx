import React from "react";
import Box from "./Box";
import { ContainerSquare } from "./BoxesContainerSquare.styles";
import { ReactComponent as Security } from "../../assets/icons/Security.svg";
import { ReactComponent as UXUI } from "../../assets/icons/UXUI.svg";
import { ReactComponent as GraphicDesign } from "../../assets/icons/GraphicDesign.svg";
import { ReactComponent as UXUI1 } from "../../assets/icons/UXUI1.svg";

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
      image: UXUI1,
      description:
        "We design intuitive and attractive interfaces to enhance the experience and engagement of your users.",
    },
    {
      id: 4,
      title: "Graphic Design",
      image: GraphicDesign,
      description:
        "We merge innovative graphic design with technological development to create exceptional visual experiences.",
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
