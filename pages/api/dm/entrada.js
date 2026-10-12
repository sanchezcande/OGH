// Entrada del agente de DM: ManyChat llama acá con cada mensaje de un contacto del agente.
//
// En ManyChat: un flujo con Solicitud externa, POST a https://www.opengatehub.com/api/dm/entrada
// (con www: sin www redirige y el encabezado se pierde), encabezado x-dm-secreto y este cuerpo:
//   { "contacto": "{{id del contacto}}", "nombre": "{{nombre}}", "texto": "{{último texto}}" }
//
// Contesta al toque (ManyChat corta a los 10 segundos) y sigue trabajando después: espera la
// ráfaga, le pide la respuesta al modelo y la manda. Ver lib/dm/agente.js.
//
// Solo guarda mensajes de contactos que son del agente. De cualquier otro no guarda nada:
// las charlas de Cande no pasan por esta base.
//
// Si la base falla contesta 200 igual, con ok en false, y le avisa a Cande: con un 500 el
// mensaje se pierde y nadie se entera.
import { waitUntil } from "@vercel/functions";
import { agente, colaDe, secretoDmValido } from "../../../lib/dm/armado";
import { anotarLead, contacto, hayBase, tablas } from "../../../lib/dm/base";
import { avisar } from "../../../lib/notificar";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    if (!(await secretoDmValido(req))) return res.status(401).json({ error: "no" });
  } catch (e) {
    console.error("dm: no se pudo validar el secreto de la entrada:", e.message);
    return res.status(503).json({ error: "sin base" });
  }
  if (!hayBase()) return res.status(503).json({ error: "sin base" });

  const b = req.body || {};
  const id = String(b.contacto ?? b.subscriber_id ?? "").trim();
  if (!id) return res.status(400).json({ error: "falta contacto" });
  const texto = String(b.texto ?? b.last_input_text ?? "").trim() || "[adjunto o mensaje sin texto]";
  // El nombre es para que el aviso a Cande diga quién es y no un número de ManyChat.
  const nombre = String(b.nombre ?? "").trim().slice(0, 80) || null;
  const quien = `${nombre || "sin nombre"} (${id})`;

  let idMensaje;
  try {
    await tablas();
    // Devuelve null si el contacto no es del agente o si es un reintento del mismo mensaje.
    idMensaje = await anotarLead(id, texto.slice(0, 4000), nombre);
    if (!idMensaje) {
      const c = await contacto(id);
      return res.status(200).json({ ok: true, dueno: c?.dueno === "agente" ? "agente" : "cande" });
    }
  } catch (e) {
    console.error("dm: falló la entrada", colaDe(id), e.message);
    await avisar("DM: falló la entrada de un mensaje", { Quién: quien, Motivo: e.message });
    return res.status(200).json({ ok: false });
  }

  waitUntil(
    // procesar ya le pasa la charla a Cande si algo falla con la traba tomada. Acá llega lo que
    // falla antes (leer los ajustes o el contacto): la charla sigue siendo del agente, y el cron
    // (/api/dm/toques) la encuentra sin contestar y se la pasa.
    agente.procesar(id, idMensaje).catch(async (e) => {
      console.error("dm: falló procesar", colaDe(id), e.message);
      await avisar("DM: el agente falló antes de contestar", { Quién: quien, Motivo: e.message });
    }),
  );
  return res.status(200).json({ ok: true, dueno: "agente" });
}

export const config = { maxDuration: 300 };
