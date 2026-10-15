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
// las charlas de Cande no pasan por esta base. Con el ajuste "altas" prendido, quien nunca
// pasó por acá entra como contacto del agente (ver recibir en lib/dm/agente.js): por eso en
// ManyChat el flujo que llama acá tiene que arrancar filtrando por la etiqueta.
//
// Si la base falla contesta 200 igual, con ok en false, y le avisa a Cande: con un 500 el
// mensaje se pierde y nadie se entera.
//
// El cuerpo se lee crudo y no con el lector de Next: ManyChat no escapa el texto del mensaje, y
// un salto de línea o unas comillas rompían el JSON y el mensaje se perdía (ver lib/dm/cuerpo.js).
import { waitUntil } from "@vercel/functions";
import { agente, avisarDm, colaDe, secretoDmValido } from "../../../lib/dm/armado";
import { cuerpoDeManyChat, leerCrudo } from "../../../lib/dm/cuerpo";
import { contacto, hayBase, tablas } from "../../../lib/dm/base";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    if (!(await secretoDmValido(req))) return res.status(401).json({ error: "no" });
  } catch (e) {
    console.error("dm: no se pudo validar el secreto de la entrada:", e.message);
    return res.status(503).json({ error: "sin base" });
  }
  if (!hayBase()) return res.status(503).json({ error: "sin base" });

  // Con bodyParser en false Next no arma req.body: se lee del pedido. Las pruebas lo pasan ya armado.
  let b;
  try {
    b = req.body !== undefined ? req.body || {} : cuerpoDeManyChat(await leerCrudo(req));
  } catch {
    return res.status(400).json({ error: "cuerpo ilegible" });
  }
  const id = String(b.contacto ?? b.subscriber_id ?? "").trim();
  if (!id) return res.status(400).json({ error: "falta contacto" });
  const texto = String(b.texto ?? b.last_input_text ?? "").trim() || "[adjunto o mensaje sin texto]";
  // El nombre es para que el aviso a Cande diga quién es y no un número de ManyChat.
  // Sin saltos de línea: el aviso a Cande lleva el nombre en el renglón "Quién", y de ahí sale a quién va su respuesta.
  const nombre = String(b.nombre ?? "").replace(/\s+/g, " ").trim().slice(0, 80) || null;
  const quien = `${nombre || "sin nombre"} (${id})`;

  let idMensaje;
  try {
    await tablas();
    // Devuelve null si el contacto no es del agente o si es un reintento del mismo mensaje.
    idMensaje = await agente.recibir(id, texto.slice(0, 4000), nombre);
    if (!idMensaje) {
      const c = await contacto(id);
      return res.status(200).json({ ok: true, dueno: c?.dueno === "agente" ? "agente" : "cande" });
    }
  } catch (e) {
    console.error("dm: falló la entrada", colaDe(id), e.message);
    await avisarDm("DM: falló la entrada de un mensaje", { Quién: quien, Motivo: e.message });
    return res.status(200).json({ ok: false });
  }

  waitUntil(
    // procesar resuelve sus fallas con la traba tomada (reintenta lo transitorio, pasa lo demás).
    // Acá llega lo que falla antes (leer los ajustes o el contacto, la base caída): la charla sigue
    // del agente y el cron (/api/dm/toques) la reintenta o se la pasa. El aviso es solo para que
    // Cande sepa: no le pide contestar, así no le contestan dos.
    agente.procesar(id, idMensaje).catch(async (e) => {
      console.error("dm: falló procesar", colaDe(id), e.message);
      await avisarDm("DM: el agente falló antes de contestar (lo reintenta solo)", { Quién: quien, Motivo: e.message });
    }),
  );
  return res.status(200).json({ ok: true, dueno: "agente" });
}

export const config = { api: { bodyParser: false }, maxDuration: 300 };
