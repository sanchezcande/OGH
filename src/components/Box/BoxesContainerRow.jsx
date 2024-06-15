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
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla quam velit, vulputate eu pharetra nec, mattis ac neque. Duis vulputate commodo lectus, ac blandit elit tincidunt id. Sed rhoncus, tortor sed eleifend tristique, tortor mauris molestie elit, et lacinia ipsum quam nec dui. Quisque nec mauris sit amet elit iaculis pretium sit amet quis magna. Aenean velit odio, elementum in tempus ut, vehicula eu diam.",
    },
    {
      id: 2,
      title: "Mission and Core Values",
      image: UXUI,
      description:
       "Pellentesque rhoncus aliquam mattis. Ut vulputate eros sed felis sodales nec vulputate justo hendrerit. A aliquam odio euismod sit amet. Quisque laoreet sem sit amet orci ullamcorper at ultricies metus viverra. Pellentesque arcu mauris, malesuada quis ornare accumsan, blandi. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam accumsan, metus ultricies eleifend gravida, nulla nunc varius lectus, nec rutrum justo nibh et metus. " },
    {
      id: 3,
      title: "Expert Team",
      image: Circle,
      description:
        " Integer at quam nec nisi imperdiet laoreet non at dolor. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Integer gravida risus a orci posuere eget tristique libero dictum. Nunc nec ligula elit. Nullam faucibus purus non nisl scelerisque bibendum. Integer eget magna non ligula sollicitudin tempor. Donec accumsan, nulla eget pulvinar ullamcorper, odio velit hendrerit quam, eget gravida augue magna eu purus. Nulla facilisi.",
    },
    {
      id: 4,
      title: "Commitment to Innovation",
      image: GraphicDesign,
      description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla quam velit, vulputate eu pharetra nec, mattis ac neque. Duis vulputate commodo lectus, ac blandit elit tincidunt id. Sed rhoncus, tortor sed eleifend tristique, tortor mauris molestie elit, et lacinia ipsum quam nec dui. Quisque nec mauris sit amet elit iaculis pretium sit amet quis magna. Aenean velit odio, elementum in tempus ut, vehicula eu diam. Pellentesque rhoncus aliquam mattis.",
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
          marginLeftParagraph="20px"
        />
      ))}
    </ContainerRow>
  );
}
