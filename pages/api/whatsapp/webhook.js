// Meta avisa acá cada vez que alguien le escribe al número de WhatsApp de la empresa. URL de alta
// en la app de Meta ("RealEstate WA Bot", 1483985306438017, en el portfolio Propbotapp):
//
//     https://www.opengatehub.com/api/whatsapp/webhook
//
// Con www: sin www el dominio redirige con un 308 y en el salto se pierden el cuerpo y la firma.
//
// POR QUÉ ESTO TIENE QUE EXISTIR ANTES DE MANDAR UN SOLO RECORDATORIO: un número dado de alta en
// WhatsApp Business Platform desaparece de la app de WhatsApp. No hay chat en el celular. Si
// alguien contesta, el mensaje llega acá y a ningún otro lado. Sin este webhook, los recordatorios
// de las llamadas (tracker/recordatorio_llamadas.py, repo Personal Brand) serían mensajes a gente
// que no te puede contestar.
//
// Qué hace: guarda lo que entra en la bandeja de WhatsApp (lib/whatsapp/base.js) y le avisa a Cande
// por el bot de Telegram del agente. Ella responde ese aviso y el texto sale tal cual por WhatsApp
// (pages/api/dm/telegram.js, lib/whatsapp/respuestas.js).
//
// Hasta que la URL no esté dada de alta y las claves no estén en Vercel, acá no entra nada: sin
// WHATSAPP_APP_SECRET ninguna firma vale y sin WHATSAPP_VERIFY_TOKEN la verificación no contesta.
// En Vercel hacen falta:
//   WHATSAPP_APP_SECRET    → App Secret de la app de Meta (Configuración > Básica)
//   WHATSAPP_VERIFY_TOKEN  → un texto cualquiera, el mismo que se pega en el alta del webhook
//   WHATSAPP_TOKEN         → token permanente del usuario del sistema (para contestar)
//   WHATSAPP_PHONE_NUMBER_ID → el id del número dado de alta (para contestar)
// Las dos primeras son para recibir; las dos últimas, para mandar. Sin las últimas se recibe y se
// avisa igual, y al contestar el bot dice que el número todavía no está dado de alta.
//
// Dos métodos:
//   GET  → la verificación de Meta: devuelve el hub.challenge tal cual, en texto pelado.
//   POST → el aviso. Se valida la firma del cuerpo crudo y se contesta 200 ENSEGUIDA: Meta reintenta
//          lo que tarda o falla, y un reintento con el mismo mensaje no tiene por qué avisar dos
//          veces. Guardar y avisar sigue después del 200, con waitUntil.
//
// Siempre 200, menos la firma que no vale (401) y un método que no es (405). Un cuerpo que no se
// puede leer o que no es JSON no se arregla reintentando: se registra y se contesta 200.
import { waitUntil } from "@vercel/functions";
import { avisarDm } from "../../../lib/dm/armado";
import { leerCrudo } from "../../../lib/dm/cuerpo";
import * as base from "../../../lib/whatsapp/base";
import { avisoDeEntrante } from "../../../lib/whatsapp/respuestas";
import {
  acusesDelEvento, desafioDeVerificacion, firmaValidaDeMeta, guardarYAvisar, mensajesDelEvento,
} from "../../../lib/whatsapp/webhook";

/** Guarda y avisa, ya pasado el 200. Sin base no hay bandeja: se registra y no se avisa a medias. */
async function atender(mensajes) {
  if (!base.hayBase()) {
    console.error("whatsapp: entró un mensaje y no hay base para guardarlo");
    return;
  }
  await base.tablas();
  const cuentas = await guardarYAvisar({
    base,
    avisar: avisarDm,
    mensajes,
    avisoDe: avisoDeEntrante,
    // Sin números ni textos en el registro: es un lead y su teléfono.
    registrar: (e) => console.error("whatsapp: un mensaje entrante no se pudo atender:", String(e?.message || e).replace(/\d{6,}/g, "…")),
  });
  // Solo cantidades.
  console.log("whatsapp: webhook", JSON.stringify(cuentas));
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const desafio = desafioDeVerificacion(req.query);
    if (!desafio) return res.status(403).json({ error: "no" });
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(200).send(desafio);
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Con bodyParser en false Next no arma req.body: la firma es del cuerpo crudo, letra por letra.
  let crudo;
  try {
    crudo = typeof req.body === "string" ? req.body : await leerCrudo(req);
  } catch (e) {
    console.error("whatsapp: no pude leer el aviso del webhook:", e.message);
    return res.status(200).json({ ok: false, motivo: "cuerpo ilegible" });
  }
  if (!firmaValidaDeMeta(crudo, req.headers["x-hub-signature-256"])) return res.status(401).json({ error: "no" });

  let cuerpo;
  try {
    cuerpo = JSON.parse(crudo);
  } catch {
    return res.status(200).json({ ok: false, motivo: "no es JSON" });
  }

  // Los acuses de entrega (sent, delivered, read) son la mayoría de los avisos y no son mensajes de
  // nadie: no se tocan la base ni Telegram por ellos, que es justamente lo que despierta a Neon.
  const mensajes = mensajesDelEvento(cuerpo);
  if (mensajes.length) {
    waitUntil(atender(mensajes).catch((e) => console.error("whatsapp: falló el webhook:", e?.message || e)));
  }
  return res.status(200).json({ ok: true, mensajes: mensajes.length, acuses: acusesDelEvento(cuerpo) });
}

// El cuerpo crudo para la firma, y lo que sigue después del 200 (waitUntil): guardar y avisar.
export const config = { api: { bodyParser: false }, maxDuration: 60 };
