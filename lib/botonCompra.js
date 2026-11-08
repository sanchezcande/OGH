// Cuándo aparece el botón de compra en /devs/gracias.
//
// Desde el 17/09 salía a la MITAD del video (decisión de Cande: su primer candidato vio el 65% y se fue sin haber visto
// nunca el botón, que entonces salía al final). La mitad iba bien con el video de 2:07 (botón a 1:03). Pero el video
// creció a 5:01, 8:49 y 9:39, y la mitad quedó en 4:49, cuando el video ya dijo "Andá a buscarla acá abajo" a 1:59 y
// "El botón sigue acá abajo" a 3:24. Llegar al botón bajó de 64% a 20% de las visitas, y los clics a comprar por visita
// de 27% a 9% (análisis del 08/11 sobre funnel_eventos).
//
// Ahora sale cuando el video lo pide: a los BOTON_SEGUNDOS o a la mitad, lo que llegue primero. Contado en segundos, un
// video más largo no lo vuelve a correr. Y al que ya lo vio en este navegador (CLAVE_BOTON_VISTO) le sale desde que
// entra: el que vuelve con el link del agente no tiene que mirar el video otra vez para encontrarlo.
export const BOTON_SEGUNDOS = 110;
export const CLAVE_BOTON_VISTO = "ogh_boton_compra_visto";

/** Si el botón ya tiene que estar, con lo que se vio del video (`actual` y `duracion` en segundos). */
export function botonVisible(actual, duracion) {
  if (!(actual > 0)) return false;
  return actual >= BOTON_SEGUNDOS || (duracion > 0 && actual / duracion >= 0.5);
}
