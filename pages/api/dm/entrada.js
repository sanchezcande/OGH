// Entrada del agente de DM: ManyChat llama acá con cada mensaje de un contacto del agente.
//
// En ManyChat: un flujo con Solicitud externa, POST a https://www.opengatehub.com/api/dm/entrada
// (con www: sin www redirige y el encabezado se pierde), encabezado x-dm-secreto y este cuerpo:
//   { "contacto": "{{id del contacto}}", "nombre": "{{nombre}}", "texto": "{{último texto}}" }
//
// Contesta al toque (ManyChat corta a los 10 segundos) y sigue trabajando después: espera la
// ráfaga, le pide la respuesta al modelo y la manda. Ver lib/dm/agente.js. Si el modelo no
// contesta (la Mac apagada o dormida), la charla queda en espera, del agente y sin aviso: la
// contesta el cron de la espera (/api/dm/espera) cuando la Mac vuelve.
//
// Un mensaje sin texto (una foto, un audio, un sticker) se guarda como "[adjunto o mensaje sin
// texto]". Una foto es casi siempre el comprobante de quien pagó en pesos: con la Mac contestando la mira
// el agente y a Cande le llega un aviso YA con la foto y el borrador del código (lo manda el bot cuando
// ella responde ok); sin la Mac, o si no la pudo ver, le llega enseguida el aviso URGENTE de siempre con
// el link de la charla, y el agente no le escribe nada por la foto sola. Ver lib/dm/agente.js.
//
// Solo guarda mensajes de contactos que son del agente. De cualquier otro no guarda nada:
// las charlas de Cande no pasan por esta base. Con el ajuste "altas" prendido, quien nunca
// pasó por acá entra como contacto del agente (ver recibir en lib/dm/agente.js): por eso en
// ManyChat el flujo que llama acá tiene que arrancar filtrando por la etiqueta.
//
// Si la base falla contesta 200 igual, con ok en false, y le avisa a Cande: con un 500 el
// mensaje se pierde y nadie se entera.
//
// Si ManyChat no llama acá (un mensaje que se pierde, alguien nuevo que nunca entra), la red de la bandeja
// (lib/dm/bandeja.js, cada 15 minutos) lo encuentra en la bandeja real de Instagram y lo guarda. Si después llega
// igual por acá, no se guarda dos veces (recibir en lib/dm/agente.js). Si el cuerpo trae "ig_mid" (el id del
// mensaje en Instagram, el mismo que da la API de Instagram), esa es la prueba de si es el mismo mensaje.
//
// El cuerpo se lee crudo y no con el lector de Next: ManyChat no escapa el texto del mensaje, y
// un salto de línea o unas comillas rompían el JSON y el mensaje se perdía (ver lib/dm/cuerpo.js).
import { waitUntil } from "@vercel/functions";
import { SIN_TEXTO } from "../../../lib/dm/agente";
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
  // "contacto"/"nombre"/"texto" es el cuerpo armado a mano en ManyChat; "id"/"name"/"last_input_text" es el
  // de "Full Contact Data" ({{subscriber_data}}), que ManyChat escapa solo. El armado a mano pegaba el texto sin
  // escapar y con un salto de línea o una comilla el JSON salía roto: ManyChat no mandaba el pedido y el mensaje
  // se perdía sin dejar rastro (37 mensajes de 26 personas entre el 17 y el 20/10).
  const id = String(b.contacto ?? b.subscriber_id ?? b.id ?? "").trim();
  if (!id) return res.status(400).json({ error: "falta contacto" });
  const texto = String(b.texto ?? b.last_input_text ?? "").trim() || SIN_TEXTO;
  // El nombre es para que el aviso a Cande diga quién es y no un número de ManyChat.
  // Sin saltos de línea: el aviso a Cande lleva el nombre en el renglón "Quién", y de ahí sale a quién va su respuesta.
  const nombre = String(b.nombre ?? b.name ?? "").replace(/\s+/g, " ").trim().slice(0, 80) || null;
  const quien = `${nombre || "sin nombre"} (${id})`;
  const mid = String(b.ig_mid ?? "").trim().slice(0, 300) || null;

  let idMensaje;
  try {
    await tablas();
    // Devuelve null si el contacto no es del agente o si es un reintento del mismo mensaje.
    idMensaje = await agente.recibir(id, texto.slice(0, 4000), nombre, { mid });
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
    // procesar resuelve sus fallas con la traba tomada (si el modelo no contesta, la charla queda en
    // espera; si falla otra cosa, pasa a Cande). Acá llega lo que falla antes (leer los ajustes o el
    // contacto, la base caída): el turno sigue abierto, la charla del agente, y la contesta el cron de
    // la espera (/api/dm/espera). Sin aviso.
    agente.procesar(id, idMensaje).catch(async (e) => {
      console.error("dm: falló procesar", colaDe(id), e.message);
    }),
  );
  return res.status(200).json({ ok: true, dueno: "agente" });
}

export const config = { api: { bodyParser: false }, maxDuration: 300 };
