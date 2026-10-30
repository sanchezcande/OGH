import { guardarEvento, hayBase } from "../lib/db";

// opengatehub.com/llamada: la agenda del 1 a 1, contando cuánta gente la abre.
//
// Hooman (31/10): "promote it on your socials direct to the calendar" y "necesitás un link que
// mida las visitas al calendario". El de Google no se puede medir, así que el que se publica es
// este y Google queda detrás.
//
// Por qué una página y no un redirect de next.config.js (como /discoverycall): un redirect no
// puede contar. Y por qué no /api/ir?a=1a1, que ya cuenta: ese link lleva parámetros a la vista, y
// los devs desconfían de un link así (Cande, 23/10, y esta semana ya la acusaron de estafa). Acá
// el link queda limpio y la cuenta pasa del lado del servidor.
//
// Medir nunca puede romper el click: si la base no contesta, igual llega al calendario.
const AGENDA = "https://calendar.app.google/fKLo7QZ8E1LakX9o7";

export async function getServerSideProps() {
  try {
    if (hayBase()) await guardarEvento("click_llamada_1a1", null);
  } catch (e) {
    console.error("llamada:", e.message);
  }
  return { redirect: { destination: AGENDA, permanent: false } };
}

// Nunca se dibuja: getServerSideProps siempre redirige.
export default function Llamada() {
  return null;
}
