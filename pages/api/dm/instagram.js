// El cron de la lectura directa de Instagram (lib/dm/instagram.js). Lo llama Vercel cada 2 minutos
// (ver vercel.json). Con el ajuste "instagram" o "seguidos" prendido:
//
//   1. Renueva el token una vez por semana (dura 60 días). Si no se puede y ya no anda, o le quedan
//      menos de 10 días, le avisa a Cande (un aviso por día como mucho).
//   2. Con el ajuste "instagram" prendido, mira las charlas que se movieron desde la vuelta anterior:
//      si Cande escribió "--" o le escribió a mano en una charla del agente, el agente sale de ahí
//      aunque el lead no vuelva a escribir. En una charla retomada (lib/dm/instagram.js), lo que ella
//      escribió a mano queda anotado como suyo y la charla sigue del agente.
//   3. Va completando el usuario de Instagram de los contactos del agente (de a 10 por vuelta,
//      ManyChat deja 10 por segundo): con eso se reconoce de quién es cada charla de la bandeja.
//
// Devuelve solo cantidades: ni ids ni usuarios salen en la respuesta ni en los registros.
import { instagram, reglasInstagram } from "../../../lib/dm/armado";
import {
  ajustes, contactoDeIg, guardarConfig, guardarIg, hayBase, leerConfig, sinUsuarioIg, soltar, tablas, textosDeLaCuenta, tomar,
} from "../../../lib/dm/base";
import { buscarCodigos, usuarioIg } from "../../../lib/dm/instagram";
import { datosDe, hayManyChat } from "../../../lib/dm/manychat";

const SOLAPE_MS = 5 * 60000; // cada vuelta vuelve a mirar los últimos 5 minutos: un "--" no se escapa entre dos vueltas
const USUARIOS_POR_VUELTA = 10;

export default async function handler(req, res) {
  const s = process.env.CRON_SECRET;
  if (!s || req.headers.authorization !== `Bearer ${s}`) return res.status(401).json({ error: "no" });
  if (!hayBase()) return res.status(200).json({ ok: true, motivo: "sin base" });
  await tablas();
  // Lee Instagram con el permiso con el que el sitio publica (lib/dm/armado.js). Sin las reglas prendidas no hace nada.
  const aj0 = await ajustes();
  if (aj0.instagram !== true && aj0.seguidos !== true) return res.status(200).json({ ok: true, motivo: "reglas apagadas" });

  const renovacion = await instagram.renovar();
  if (renovacion.hecho === "falló") {
    console.error("dm: no se pudo renovar el token de Instagram", renovacion.error?.code ?? "", String(renovacion.error?.message || "").replace(/\d{6,}/g, "…"));
    // Un token de menos de 24 horas no se puede renovar todavía: eso no es para avisar. Se avisa si
    // el token ya no anda o si está por vencer.
    const dias = await instagram.diasQueQuedan();
    try {
      await instagram.anda();
      if (dias !== null && dias <= 10) await reglasInstagram.fallo(renovacion.error);
    } catch (e) {
      await reglasInstagram.fallo(e);
    }
  }

  const aj = await ajustes();
  if (aj.instagram !== true) return res.status(200).json({ ok: true, renovacion: renovacion.hecho, motivo: "reglas apagadas" });

  let miradas = 0;
  let sacadas = 0;
  let anotadas = 0;
  try {
    const visto = await leerConfig("instagram_visto");
    const ultimo = visto?.hasta ? new Date(visto.hasta) : null;
    const desde = ultimo ? new Date(ultimo.getTime() - SOLAPE_MS) : null;
    // La primera vez mira solo las 10 últimas: los "--" viejos los ve el agente al contestar.
    const r = await buscarCodigos({
      ig: instagram, base: { contactoDeIg, guardarIg, tomar, soltar, textosDeLaCuenta }, reglas: reglasInstagram, desde, limite: ultimo ? 20 : 10,
    });
    ({ miradas, sacadas, anotadas } = r);
    if (r.hasta && (!ultimo || r.hasta > ultimo)) await guardarConfig("instagram_visto", { hasta: r.hasta.toISOString() });
  } catch (e) {
    await reglasInstagram.fallo(e);
  }

  let usuarios = 0;
  if (hayManyChat()) {
    let fallas = 0;
    for (const id of await sinUsuarioIg(USUARIOS_POR_VUELTA)) {
      const d = await datosDe(id);
      if (!d.ok) {
        if (++fallas >= 3) break; // ManyChat no contesta: sigue la próxima vuelta
        continue;
      }
      await guardarIg(id, { usuario: usuarioIg(d.ig_username), igIdMc: d.ig_id != null && d.ig_id !== "" ? String(d.ig_id) : "" });
      usuarios++;
    }
  }
  return res.status(200).json({ ok: true, renovacion: renovacion.hecho, miradas, sacadas, anotadas, usuarios });
}

export const config = { maxDuration: 60 };
