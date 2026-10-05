import { guardarEvento, hayBase } from "../../lib/db";

// Redirección propia para medir los clicks de las cadenas de mails (05/10).
//
// Por qué no el click tracking de Resend: reescribe TODOS los links para que pasen por
// un dominio suyo. Eso baja la entregabilidad justo después de haber arreglado el SPF,
// y los filtros penalizan los links redirigidos a un dominio que no es el que firma el
// mail. Acá el link es opengatehub.com, el mismo dominio que firma, así que está
// alineado y no cambia nada de la entregabilidad.
//
// El destino sale de una lista cerrada: nunca redirige a lo que venga en la URL (si
// no, cualquiera podría usar este link para mandar gente a donde quiera, firmado por
// el dominio de Cande). Un destino que no está en la lista va a la home.
//
// Guarda el evento igual que el resto del embudo (funnel_eventos: solo fase, sin
// nadie identificado). `m` dice de qué mail de la cadena vino, así se puede sacar el
// CTR por mail cruzando contra las columnas drip_* de red_devs (cuántos se mandaron).
const DESTINOS = {
  guia: "https://get.opengatehub.com/l/acelerador-de-carrera",
  llamada: "https://strategy.opengatehub.com",
};
const HOME = process.env.NEXT_PUBLIC_SITE_URL || "https://opengatehub.com";
const CODIGO = /^[a-z0-9]{1,12}$/;

export default async function handler(req, res) {
  const a = String(req.query.a || "");
  const m = String(req.query.m || "");
  const destino = DESTINOS[a];
  res.setHeader("Cache-Control", "no-store");
  if (!destino) return res.redirect(302, HOME);
  try {
    if (hayBase() && CODIGO.test(m)) await guardarEvento(`mail_click_${a}_${m}`, null);
  } catch (e) {
    console.error("ir:", e.message);   // medir nunca puede romper el click
  }
  return res.redirect(302, destino);
}
