// El webhook de comentarios de Instagram: el DM con la lista sale a los segundos y no a los 15
// minutos (02/11).
//
// Por qué: el respaldo de CV (pages/api/dm/comentarios.js) es un cron cada 15 minutos, así que
// alguien que comenta a las 12:01 recibe la lista a las 12:15. ManyChat contestaba a los 7 segundos
// y no porque fuera más rápido: usaba el webhook de Meta, que avisa en el momento. Bajar el cron no
// es la salida, porque todos los crons que tocan la base despiertan a Neon en los mismos minutos
// (lib/crons.js, tests/crons.test.mjs) y con crons más seguidos la base no dormía nunca.
//
// Cómo avisa Meta: un POST por cada comentario nuevo, con la firma del cuerpo en el encabezado
// x-hub-signature-256 (HMAC-SHA256 del cuerpo CRUDO con el App Secret de la app de Meta). El cuerpo
// de un comentario de Instagram es así:
//   { "object": "instagram",
//     "entry": [{ "id": "<la cuenta>", "time": 1762…,
//                 "changes": [{ "field": "comments",
//                               "value": { "id": "<el comentario>", "text": "CV",
//                                          "from": { "id": "…", "username": "…" },
//                                          "media": { "id": "…" } } }] }] }
// El id del comentario que viene ahí es el que come la private reply, que es lo que manda
// responderComentario (lib/dm/instagram.js).
//
// El cron NO se saca: es la red de contención. Si un evento se pierde (Meta reintenta y desiste, la
// función falla, el deploy está caído), la vuelta siguiente del cron lo levanta igual. Las dos
// puertas se anotan en la misma tabla (lib/dm/comentariosBase.js) ANTES de mandar, así que el que
// entró por acá no vuelve a salir por el cron ni al revés.
//
// Funciones puras menos la última: sin base y sin red. Lo que toca Instagram está en
// lib/dm/instagram.js y lo que toca la base, en lib/dm/comentariosBase.js.
import { createHmac, timingSafeEqual } from "node:crypto";
import { DESPACIO, TEXTO_CV, esPalabraCV, motivoDelError } from "./comentarios";

/**
 * El App Secret de la app de Meta, con el que viene firmado cada aviso. Se lee en cada llamada y no
 * al cargar el archivo: así cambiarlo en el entorno (o en una prueba) no pide reiniciar.
 *
 * Sin esta clave NINGÚN aviso pasa (ver firmaValidaDeMeta). Es lo contrario de la firma del link del
 * formulario (lib/dm/firmaIg.js), que sin clave deja pasar: esto es una URL abierta a internet y sin
 * la firma cualquiera que la conozca puede hacer que la cuenta le escriba a quien quiera.
 */
const secreto = () => process.env.IG_APP_SECRET || "";
/** El token que Meta devuelve en la verificación de la URL, para saber que el endpoint es nuestro. */
const tokenVerificacion = () => process.env.IG_WEBHOOK_VERIFY_TOKEN || "";

/** Están configuradas las dos claves? Sin ellas el endpoint está inerte y contesta solo el cron. */
export const webhookConfigurado = () => Boolean(secreto() && tokenVerificacion());

/** Dos textos iguales, comparados en tiempo constante (uno más corto no vale). */
function iguales(a, b) {
  const x = Buffer.from(String(a ?? ""));
  const y = Buffer.from(String(b ?? ""));
  return x.length > 0 && x.length === y.length && timingSafeEqual(x, y);
}

/** La firma que tendría que traer este cuerpo, tal como la manda Meta ("sha256=<hex>"). */
export function firmaDeMeta(crudo, clave = secreto()) {
  if (!clave) return null;
  return `sha256=${createHmac("sha256", clave).update(String(crudo ?? ""), "utf8").digest("hex")}`;
}

/**
 * El aviso viene firmado por Meta? Se firma el cuerpo CRUDO, con los espacios y el orden con los que
 * llegó: por eso el endpoint lee el stream y no usa el lector de Next (bodyParser en false).
 */
export function firmaValidaDeMeta(crudo, encabezado, clave = secreto()) {
  const esperada = firmaDeMeta(crudo, clave);
  return Boolean(esperada) && typeof encabezado === "string" && iguales(encabezado.trim(), esperada);
}

/**
 * La respuesta a la verificación de la URL (el GET que hace Meta al dar de alta el webhook): el
 * hub.challenge si el modo y el token son los que esperamos, o null. Sin token configurado no se
 * verifica nada: así nadie da de alta esta URL en otra app de Meta.
 */
export function desafioDeVerificacion(query, token = tokenVerificacion()) {
  const q = query || {};
  if (!token || q["hub.mode"] !== "subscribe" || !iguales(q["hub.verify_token"], token)) return null;
  return String(q["hub.challenge"] ?? "") || null;
}

/**
 * Los comentarios que trae un aviso: { id, texto, medio, usuario, de }.
 *
 * Deja afuera todo lo que no sea un comentario de Instagram (los avisos de mensajes siguen
 * entrando por la bandeja y por ManyChat, y los de live_comments no se contestan) y lo que comenta
 * la cuenta misma, que es Cande contestando sus propios posts: su id es el de la entrada del aviso,
 * así que se sabe sin preguntarle nada a Instagram.
 *
 * Un id repetido se cuenta una vez: Meta puede repetir el mismo evento en el mismo lote, y el
 * reintento de un lote entero por un 500 nuestro llega igual que el primero.
 */
export function comentariosDelEvento(cuerpo) {
  if (cuerpo?.object !== "instagram") return [];
  const vistos = new Set();
  const salida = [];
  for (const entrada of cuerpo.entry || []) {
    const cuenta = String(entrada?.id || "");
    for (const cambio of entrada?.changes || []) {
      if (cambio?.field !== "comments") continue;
      const v = cambio.value || {};
      const id = String(v.id || "");
      const de = String(v.from?.id || "");
      if (!id || vistos.has(id) || (cuenta && de === cuenta)) continue;
      vistos.add(id);
      salida.push({
        id,
        texto: String(v.text ?? ""),
        medio: v.media?.id ? String(v.media.id) : null,
        usuario: v.from?.username ? String(v.from.username) : null,
        de: de || null,
      });
    }
  }
  return salida;
}

/**
 * Contesta los comentarios de un aviso. Todo entra por parámetro, así se prueba sin red y sin base
 * (tests/igWebhook.test.mjs).
 *
 * `ig` es el cliente de lib/dm/instagram.js (responderComentario). `base` es
 * lib/dm/comentariosBase.js (tomarComentario, anotarComentario, soltarComentario, tieneDmDeCV).
 * `avisar` es el aviso de Telegram del agente (lib/dm/armado.js, avisarDm).
 *
 * Lo que NO hace, y el cron sí: mirar la bandeja. Esa traba era contra el automático de CV de
 * ManyChat, que contestaba el mismo comentario a los 7 segundos, y para eso no sirve de nada acá: a
 * los dos segundos del comentario la bandeja todavía no muestra la respuesta de nadie. Lo que sí se
 * mira es si esa persona ya tiene su DM de CV de otro comentario (tieneDmDeCV), que es una consulta
 * sola y es la misma regla del cron: el que comenta CV en dos reels recibe la lista una vez.
 * Mientras el automático de CV de ManyChat siga vivo, el webhook se apaga con dm_config
 * "comentarios" en { webhook: false } y contesta solo el cron, que sí mira la bandeja.
 *
 * El orden de cada comentario es el mismo que en el cron: primero queda tomado en la base y después
 * sale el DM. Si la función se corta en el medio, el comentario queda tomado y nadie lo vuelve a
 * intentar, porque peor que un lead sin respuesta es uno con la misma respuesta dos veces.
 */
export async function contestarDelWebhook({
  ig, base, comentarios, texto = TEXTO_CV, avisar = async () => {}, registrar = () => {},
}) {
  const cuentas = {
    eventos: (comentarios || []).length, piden: 0, enviadas: 0, ya_contestado: 0, vencido: 0,
    sin_aceptar: 0, errores: 0, ya_tenia: 0,
  };
  for (const c of comentarios || []) {
    if (!esPalabraCV(c.texto)) continue;
    cuentas.piden++;
    // Ya recibió la lista por otro comentario: no se le manda de nuevo.
    if (c.usuario && base.tieneDmDeCV && (await base.tieneDmDeCV(c.usuario))) {
      cuentas.ya_tenia++;
      continue;
    }
    // Lo tomó el cron, u otro aviso del mismo comentario que llegó antes: no se manda nada.
    if (!(await base.tomarComentario(c.id, { medio: c.medio, usuario: c.usuario }))) continue;
    try {
      const r = await ig.responderComentario(c.id, texto);
      await base.anotarComentario(c.id, "enviada", { igId: r?.recipient_id ? String(r.recipient_id) : c.de });
      cuentas.enviadas++;
    } catch (e) {
      const motivo = motivoDelError(e);
      // Un pedido que se cortó por tiempo pudo haber salido igual: no se suelta y no se reintenta.
      if (e?.demora) {
        await base.anotarComentario(c.id, "enviando", { detalle: "incierta: se cortó por tiempo" });
        cuentas.errores++;
        continue;
      }
      // Instagram pidió despacio: no llegó a procesar el envío, así que el comentario se suelta y lo
      // levanta la vuelta siguiente del cron.
      if (motivo === "otro" && DESPACIO.includes(e?.code)) {
        await base.soltarComentario(c.id);
        cuentas.errores++;
        continue;
      }
      await base.anotarComentario(c.id, motivo === "otro" ? "error" : motivo, { detalle: e?.message || String(e) });
      cuentas[motivo === "otro" ? "errores" : motivo]++;
      registrar(motivo, e);
      if (motivo === "sin_aceptar") {
        // Esto solo lo destraba Cande aceptando la solicitud en la app: callarse sería perder al
        // lead. Después lo reintenta el cron cada SIN_ACEPTAR_HORAS, sin volver a avisar.
        await avisar("Un comentario con CV quedó sin contestar", {
          Quién: c.usuario ? `@${c.usuario}` : "no se sabe",
          Qué: "me escribió CV en un comentario pero el DM queda en una solicitud sin aceptar",
          Hacé: "aceptale la solicitud en Instagram y le mando la lista",
        }, { contestable: false });
      }
    }
  }
  return cuentas;
}
