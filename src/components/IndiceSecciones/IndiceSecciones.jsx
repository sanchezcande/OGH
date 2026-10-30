// El índice de la home: una barra con las secciones, pegada abajo del menú.
//
// 31/10, Cande: "no se entiende cómo ir a los casos de uso de la página principal, debería tener
// tipo índice la landing que scrollee a las distintas secciones". La home es larga (nueve bloques) y
// el menú de arriba solo lleva a otras páginas, así que lo que está a mitad de página no existe para
// el que entra: hay que bajar a ciegas hasta encontrarlo.
//
// Son anclas de verdad (<a href="#id">), no botones con JavaScript: funcionan con el teclado, se
// pueden abrir en otra pestaña, quedan en la dirección para compartir y andan aunque el JS falle.
// El scroll suave ya viene de GlobalStyles (y respeta a quien pidió menos movimiento en su sistema).
//
// La sección en la que estás se marca sola con IntersectionObserver. Si el navegador no lo tiene,
// no se marca ninguna y el índice sigue sirviendo igual.
import React, { useEffect, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";

import { color, font, mq } from "../../styles/kit";

// Las secciones del kit tienen scroll-margin-top para no quedar tapadas por el menú. Con el índice
// hay una barra más, así que el ancla tiene que bajar otro tanto. Solo en las páginas que lo usan.
const Anclaje = createGlobalStyle`
  :root { --anclaje: 128px; }
  ${mq.mobile} { :root { --anclaje: 116px; } }
`;

export default function IndiceSecciones({ items, etiqueta = "Secciones de esta página" }) {
  const [activa, setActiva] = useState(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const secciones = items
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean);
    if (!secciones.length) return undefined;

    // El margen de arriba descuenta el menú y el índice: la sección cuenta como "la que estás
    // mirando" recién cuando asoma debajo de las dos barras, no cuando se asoma arriba de todo.
    const observador = new IntersectionObserver(
      (entradas) => {
        const visibles = entradas.filter((e) => e.isIntersecting);
        if (!visibles.length) return;
        const primera = visibles.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        setActiva(primera.target.id);
      },
      { rootMargin: "-132px 0px -55% 0px", threshold: 0 }
    );
    secciones.forEach((s) => observador.observe(s));
    return () => observador.disconnect();
  }, [items]);

  return (
    <>
      <Anclaje />
      <Barra aria-label={etiqueta}>
        <Pista>
          {items.map(({ id, label }) => (
            <Ancla key={id} href={`#${id}`} $activa={activa === id} aria-current={activa === id ? "true" : undefined}>
              {label}
            </Ancla>
          ))}
        </Pista>
      </Barra>
    </>
  );
}

// 72px es el alto del menú (64 en pantallas chicas): el índice se pega justo abajo y nunca lo tapa.
const Barra = styled.nav`
  position: sticky;
  top: 72px;
  z-index: 90;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: saturate(180%) blur(8px);
  border-bottom: 1px solid ${color.line};

  ${mq.tablet} {
    top: 64px;
  }
`;

const Pista = styled.div`
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 32px;
  display: flex;
  gap: 28px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  ${mq.mobile} {
    /* En el celular se arrastra de costado, y el aire a los lados hace ver que sigue. */
    padding: 0 20px;
    gap: 20px;
  }
`;

const Ancla = styled.a`
  flex: none;
  font-family: ${font.brand};
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: ${({ $activa }) => ($activa ? color.ink : color.muted)};
  text-decoration: none;
  padding: 15px 0 13px;
  border-bottom: 2px solid ${({ $activa }) => ($activa ? color.accent : "transparent")};
  white-space: nowrap;
  transition: color 0.15s ease, border-color 0.15s ease;

  &:hover,
  &:focus-visible {
    color: ${color.ink};
  }
`;
