// La pasada rápida de la bandeja (30/10). Lo llama Vercel cada 3 minutos (vercel.json y lib/crons.js), en los
// minutos 1, 4, 7… para no caer en los del barrido profundo (/api/dm/bandeja, cada 15 minutos).
//
// Por qué existe: hasta el 29/10 el agente se enteraba de un mensaje nuevo al toque, porque ManyChat llamaba a
// /api/dm/entrada con cada uno. La cuenta de ManyChat se pasó del tope de su plan y pausó todas sus
// automatizaciones, así que lo único que queda es la red de la bandeja, que barre de a 10 páginas desde un cursor
// que va girando: un mensaje nuevo empuja su charla al puesto 1, pero el barrido puede estar leyendo la página 8
// del ciclo anterior. Con más de 700 charlas eso era hasta media hora de demora (el 29/10: @dylanezeegomez esperó
// 29 minutos y @soy_ferzon, 10 horas; las respuestas del agente cayeron de 748 el 28/10 a 68).
//
// Qué hace: UNA página de la bandeja (las ~50 charlas movidas más recientes, un solo pedido a Meta), mirada con el
// mismo código y las mismas trabas que el barrido (revisarBandeja con `rapida: true`). Cualquier mensaje nuevo está
// en esa página por definición. Lo guarda igual que el barrido y lo contesta la espera (/api/dm/espera).
//
// Lo que no hace, para no romper el barrido:
//   - No toca el cursor del barrido (dm_config "bandeja_paginas"), ni su marca: si la escribiera, el barrido
//     volvería arriba en cada vuelta y las charlas del fondo no se mirarían nunca, y vigilarRed tomaría una pasada
//     rápida por una vuelta entera de la bandeja.
//   - No llama a vigilarRed: ese reloj mide las vueltas del barrido (anota cada intento en "bandeja_salud" y
//     compara con la marca de la última vuelta entera). Anotar acá un intento cada 3 minutos le haría avisar
//     "la red de la bandeja no anda" todo el tiempo. Lo que sí avisa es Instagram caído, con el mismo aviso de
//     siempre (reglasInstagram.fallo: uno por día como mucho, y nada por una demora).
//
// Devuelve solo cantidades: ni ids ni usuarios salen en la respuesta ni en los registros.
import { avisarDm, instagram, reglasInstagram } from "../../../lib/dm/armado";
import { revisarBandeja } from "../../../lib/dm/bandeja";
import {
  ajustes, anotarCandeDesdeIg, anotarDesdeBandeja, contacto, contactoDeIg, darDeAltaDesdeBandeja, enviadosEnLaCharla, guardarConfig, guardarIg, hayBase,
  leadsGuardados, leerConfig, loSigue, salidaSinLlegar, soltar, tablas, textosDeLaCuenta, tomar,
} from "../../../lib/dm/base";
import { ErrorInstagram } from "../../../lib/dm/instagram";
import { buscarPorNombre, datosDe, hayManyChat, ponerEtiqueta } from "../../../lib/dm/manychat";

// Una vuelta normal tarda segundos: una página de la bandeja y lo que haya que guardar. El margen es para cuando
// Meta tarda (una página puede llevarle 25 segundos) y el resumen, otros 15: como el barrido, no se mira otra charla
// pasados los 80 segundos. Con menos, una página lenta se comía la vuelta entera y no se miraba ninguna charla.
// Entra de sobra antes de la vuelta siguiente (3 minutos).
const MARGEN_S = 40;

// Sin ids en el registro: Instagram los repite en sus errores.
const registrar = (e) => console.error("dm: falló algo en la pasada rápida de la bandeja", e?.code ?? "", String(e?.message || "").replace(/\d{6,}/g, "…"));

export default async function handler(req, res) {
  const inicio = Date.now();
  // Solo el cron de Vercel (manda "Bearer CRON_SECRET"), como /api/dm/bandeja. Sin el secreto cargado no entra nadie.
  const s = process.env.CRON_SECRET;
  if (!s || req.headers.authorization !== `Bearer ${s}`) return res.status(401).json({ error: "no" });
  if (!hayBase()) return res.status(200).json({ ok: true, motivo: "sin base" });

  let r = { paginas: 0, miradas: 0, recuperados: 0, altas: 0, pendientes: 0, fallas: 0, resumen: false };
  try {
    await tablas();
    const aj = await ajustes();
    // El mismo ajuste que el barrido: apagar la red de la bandeja apaga las dos vueltas.
    if (aj.bandeja === false) return res.status(200).json({ ok: true, motivo: "red de la bandeja apagada" });
    r = await revisarBandeja({
      ig: instagram,
      base: {
        leerConfig, guardarConfig, contactoDeIg, contacto, guardarIg, loSigue, textosDeLaCuenta, enviadosEnLaCharla, leadsGuardados,
        tomar, soltar, anotarDesdeBandeja, anotarCandeDesdeIg, darDeAltaDesdeBandeja, salidaSinLlegar,
      },
      manychat: { hayManyChat, buscarPorNombre, datosDe, ponerEtiqueta },
      aj,
      avisar: avisarDm,
      hasta: inicio + (config.maxDuration - MARGEN_S) * 1000,
      registrar,
      rapida: true,
    });
  } catch (e) {
    // Lo de Instagram, como los demás crons (un aviso por día, nada por una demora). Lo demás queda en el registro:
    // el aviso de la red caída lo da el barrido, que es el que mide sus vueltas.
    if (e instanceof ErrorInstagram) await reglasInstagram.fallo(e);
    else registrar(e);
    return res.status(200).json({ ok: false, ...r });
  }
  return res.status(200).json({ ok: true, ...r });
}

export const config = { maxDuration: 120 };
