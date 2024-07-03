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
        "OpenGateHub stands out in the field of digital health, continuously adapting to the changing technological landscape. Our commitment to innovation and excellence is reflected in how we secure our clients' digital resources, ensuring safe and effective solutions that enhance health care and management in the digital age.",
    },
    {
      id: 2,
      title: "Mission and Core Values",
      image: UXUI,
      description:
       "At OpenGateHub, our mission is to transform the healthcare sector with innovative technological solutions that enhance the well-being and efficiency of industry businesses. We are guided by values of innovation, excellence, commitment to our clients, and data security, offering personalized and effective solutions to drive progress and security in digital healthcare." },
    {
      id: 3,
      title: "Technologies",
      image: Circle,
      description:
        " At OpenGateHub, we master a wide range of key technologies to deliver advanced digital solutions. From graphic design and motion graphics to intuitive interfaces (UX/UI), our capabilities include HTML, CSS, JavaScript, React for dynamic applications, Python, Flask & Django for robust backend, PHP for web scalability, and JAVA with Spring for enterprise applications. We also efficiently manage databases such as MySQL and SQL, ensuring tailored and high-performance solutions.",
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
