// Meta avisa acá cada vez que alguien comenta un post o un reel de Cande, y el DM con la lista de
// developers sale a los segundos (02/11). URL de alta en la app de Meta:
//
//     https://www.opengatehub.com/api/ig/webhook
//
// Con www: sin www el dominio redirige con un 308 y en el salto se pierden el cuerpo y la firma.
//
// Esto es lo último que le faltaba al reemplazo de ManyChat. El respaldo (/api/dm/comentarios) ya
// contestaba estos comentarios, pero es un cron cada 15 minutos; ManyChat llegaba a los 7 segundos
// porque usaba este mismo webhook. El cron se queda como red de contención: si un aviso se pierde,
// la vuelta siguiente lo levanta (ver lib/dm/webhookIg.js).
//
// Hasta que la URL no esté dada de alta en la app de Meta y las dos claves no estén en Vercel, acá
// no entra nada: sin IG_APP_SECRET ninguna firma vale y sin IG_WEBHOOK_VERIFY_TOKEN la verificación
// no contesta. En Vercel hacen falta:
//   IG_APP_SECRET              → App Secret de la app de Meta (Configuración > Básica)
//   IG_WEBHOOK_VERIFY_TOKEN    → un texto cualquiera, el mismo que se pega en el alta del webhook
// Los pasos están en docs/webhook-instagram.md.
//
// Dos métodos:
//   GET  → la verificación de Meta: devuelve el hub.challenge tal cual, en texto pelado.
//   POST → el aviso. Se valida la firma del cuerpo crudo y se contesta 200 ENSEGUIDA: Meta reintenta
//          lo que tarda o falla, y un reintento con los mismos comentarios no tiene por qué pasar
//          dos veces por la base. El envío sigue después del 200, con waitUntil.
//
// Siempre 200, menos la firma que no vale (401) y un método que no es (405). Un cuerpo que no se
// puede leer o que no es JSON no se arregla reintentando: se registra y el cron lo levanta igual.
import { waitUntil } from "@vercel/functions";
import { avisarDm, instagram } from "../../../lib/dm/armado";
import { ajustes, hayBase, leerConfig } from "../../../lib/dm/base";
import {
  anotarComentario, soltarComentario, tablaComentarios, tieneDmDeCV, tomarComentario, tomarPublica,
} from "../../../lib/dm/comentariosBase";
import { leerCrudo } from "../../../lib/dm/cuerpo";
import { comentariosDelEvento, contestarDelWebhook, desafioDeVerificacion, firmaValidaDeMeta } from "../../../lib/dm/webhookIg";

/**
 * Manda los DM de los comentarios del aviso, ya pasado el 200. Las mismas llaves que el cron: el
 * ajuste "comentarios" prendido y el agente no apagado. Con { webhook: false } contesta solo el
 * cron, que mira la bandeja (ver lib/dm/webhookIg.js).
 */
async function atender(comentarios) {
  if (!hayBase()) return;
  const ajuste = (await leerConfig("comentarios")) || {};
  if (ajuste.activo !== true || ajuste.webhook === false) return;
  // Con el agente apagado del todo no sale nada de la cuenta: si ella lo apagó es porque no quiere
  // que la cuenta le escriba a nadie. En sombra sí sale: el DM de CV es un texto fijo, no lo
  // redacta el modelo.
  const aj = await ajustes();
  if (aj.modo === "apagado") return;
  await tablaComentarios();
  const cuentas = await contestarDelWebhook({
    ig: instagram,
    base: { tomarComentario, anotarComentario, soltarComentario, tieneDmDeCV, tomarPublica },
    comentarios,
    avisar: avisarDm,
    // Sin ids ni textos en el registro: Instagram los repite en sus errores.
    registrar: (motivo, e) => console.error("ig: un comentario con CV no se pudo contestar", motivo, e?.code ?? "", e?.subcode ?? ""),
  });
  // Solo cantidades: ni ids ni usuarios salen en los registros.
  if (cuentas.piden) console.log("ig: webhook de comentarios", JSON.stringify(cuentas));
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
    console.error("ig: no pude leer el aviso del webhook:", e.message);
    return res.status(200).json({ ok: false, motivo: "cuerpo ilegible" });
  }
  if (!firmaValidaDeMeta(crudo, req.headers["x-hub-signature-256"])) return res.status(401).json({ error: "no" });

  let cuerpo;
  try {
    cuerpo = JSON.parse(crudo);
  } catch {
    return res.status(200).json({ ok: false, motivo: "no es JSON" });
  }

  // Sin comentarios en el aviso no se toca la base: los avisos de mensajes y los de la cuenta misma
  // no tienen nada que hacer acá, y despertar a Neon por cada uno es justamente lo que se cuida.
  const comentarios = comentariosDelEvento(cuerpo);
  if (comentarios.length) {
    waitUntil(atender(comentarios).catch((e) => console.error("ig: falló el webhook de comentarios:", e?.message || e)));
  }
  return res.status(200).json({ ok: true, comentarios: comentarios.length });
}

// El cuerpo crudo para la firma, y el envío que sigue después del 200 (waitUntil): un DM por
// comentario, unos segundos cada uno.
export const config = { api: { bodyParser: false }, maxDuration: 60 };
