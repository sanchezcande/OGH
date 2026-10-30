// Los dos campos que delatan un envío automático, del lado de la página.
//
// Van en todos los formularios públicos y los mira lib/antispam.js en la API:
//   - `t0`: cuándo se abrió el formulario. Un envío que tarda menos de dos segundos no lo hizo una
//     persona, y el de devs son 15 campos.
//   - `web`: la trampa. Está fuera de la pantalla y sin tab, así que una persona no la ve ni la pisa
//     sin querer; los bots llenan todo lo que encuentran en el HTML. El nombre es el que ya usaba
//     /preguntas desde el 18/09, no uno nuevo: así hay una sola trampa y no una por formulario. Y no
//     se llama "website" ni "url" a propósito: con un nombre que el navegador reconoce, el
//     autocompletado de alguien real podría llenarlo y dejarlo afuera sin que se entere.
//
// Nada de esto para al que le pega directo a la API sin abrir la página: eso lo corta el tope por IP
// de lib/antispam.js. Son dos capas distintas y las dos hacen falta.

import React from "react";

const ESCONDIDO = {
  position: "absolute",
  left: "-9999px",
  width: "1px",
  height: "1px",
  opacity: 0,
  pointerEvents: "none",
};

/** `campos()` es lo que se le suma al body del envío, y `trampa` el input que va dentro del form. */
export function useTrampa() {
  const abierto = React.useRef(Date.now());
  const campo = React.useRef(null);

  const campos = React.useCallback(
    () => ({ t0: abierto.current, web: campo.current ? campo.current.value : "" }),
    []
  );

  const trampa = React.createElement("input", {
    ref: campo,
    type: "text",
    name: "web",
    defaultValue: "",
    tabIndex: -1,
    autoComplete: "off",
    "aria-hidden": "true",
    style: ESCONDIDO,
  });

  return { campos, trampa };
}
