import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { color, mq, useLang } from "../../styles/kit";

const LABEL = { es: "Volver arriba", en: "Back to top" };

// Flecha para volver arriba. Aparece recién cuando ya se bajó un tramo de la página.
const ScrollTop = () => {
  const lang = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Arrow
      type="button"
      aria-label={LABEL[lang]}
      title={LABEL[lang]}
      $visible={visible}
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <span aria-hidden="true">↑</span>
    </Arrow>
  );
};

export default ScrollTop;

const Arrow = styled.button`
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 90;
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${color.paper};
  color: ${color.ink};
  border: 1px solid ${color.ink};
  border-radius: 4px;
  font-size: 1.125rem;
  line-height: 1;
  cursor: pointer;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: translateY(${({ $visible }) => ($visible ? "0" : "8px")});
  pointer-events: ${({ $visible }) => ($visible ? "auto" : "none")};
  transition: opacity 0.25s ease, transform 0.25s ease, background 0.2s ease, color 0.2s ease;

  &:hover {
    background: ${color.ink};
    color: ${color.onInk};
  }

  &:focus-visible {
    outline: 2px solid ${color.accentBrand};
    outline-offset: 3px;
  }

  ${mq.mobile} {
    right: 16px;
    bottom: 16px;
    width: 42px;
    height: 42px;
  }
`;
