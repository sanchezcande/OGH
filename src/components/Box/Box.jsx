import React, { useRef } from "react";
import { useSpring, animated, to } from "@react-spring/web";
import { useGesture } from "react-use-gesture";
import { DarkButton } from "../Button/Button";
import { ReactComponent as GraphicDesign } from "../../assets/icons/GraphicDesign.svg";
import ExpandableCard from "./ExpandableCard/ExpandableCard";

import styles from "./Box.module.css";

const calcX = (y, ly) => -(y - ly - window.innerHeight / 2) / 20;
const calcY = (x, lx) => (x - lx - window.innerWidth / 2) / 20;

const defaultImagen = () => <GraphicDesign />;
const defaultTitle = "Default Title";
const defaultDescription =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore";

const Card = ({
  imagen: Imagen = defaultImagen,
  title,
  description,
  buttonText,
  height,
  width,
  marginLeftParagraph,
  handleButtonClick,
  imageBottom,
}) => {
  const domTarget = useRef(null);
  const [{ x, y, rotateX, rotateY, rotateZ, zoom, scale }, api] = useSpring(
    () => ({
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      scale: 1,
      zoom: 0,
      x: 0,
      y: 0,
      config: { mass: 5, tension: 350, friction: 40 },
    })
  );

  useGesture(
    {
      onPinch: ({ offset: [d, a] }) => api({ zoom: d / 200, rotateZ: a }),
      onMove: ({ xy: [px, py], dragging }) =>
        !dragging &&
        api({
          rotateX: calcX(py, y.get()),
          rotateY: calcY(px, x.get()),
          scale: 1.1,
        }),
      onHover: ({ hovering }) =>
        !hovering && api({ rotateX: 0, rotateY: 0, scale: 1 }),
    },
    { domTarget, eventOptions: { passive: false } }
  );

  return (
    <animated.div
      ref={domTarget}
      className={styles.card}
      style={{
        transform: "perspective(600px)",
        x,
        y,
        scale: to([scale, zoom], (s, z) => s + z),
        rotateX,
        rotateY,
        rotateZ,
        height: `${height}px`,
        width: `${width}px`,
      }}
    >
      <div className={styles.textContainer}>
        {!imageBottom && (
          <div className={styles.image}>
            <Imagen />{" "}
          </div>
        )}
        <h1 className={styles.title} >{title}</h1>
        <p style={{ marginLeft: marginLeftParagraph }}>{description}</p>
        {imageBottom && (
          <div
            className={`${styles.image}`}
            style={{ width: "64px", height: "64px", justifySelf: "center" }}
          >
            <Imagen />
          </div>
        )}
        {buttonText && (
          <DarkButton
            className={styles.customdarkbutton}
            onClick={handleButtonClick}
          >
            {buttonText}
          </DarkButton>
        )}
      </div>
    </animated.div>
  );
};

const Box = ({
  id,
  buttonText,
  description,
  imagen,
  title,
  height = 200,
  width = 272,
  marginLeftParagraph = 0,
  imageBottom = true,
  handleBoxClick,
  isOpen,
}) => {
  const handleButtonClick = () => {
    handleBoxClick(id);
  };

  return (
    <div className={styles.container}>
      <Card
        imagen={imagen || defaultImagen}
        title={title || defaultTitle}
        description={description || defaultDescription}
        buttonText={buttonText}
        height={height}
        width={width}
        marginLeftParagraph={marginLeftParagraph}
        handleButtonClick={handleButtonClick}
        imageBottom={imageBottom}
      />
      {isOpen && (
        <ExpandableCard closeCard={() => handleBoxClick(null)} id={id} />
      )}
    </div>
  );
};
export default Box;
