// La redacción: se le pide a Claude la respuesta para un turno de la charla.
//
// Config en Vercel: ANTHROPIC_API_KEY (el SDK la lee sola). Opcionales: DM_MODELO y DM_ESFUERZO.
//
// El prompt de sistema es largo y siempre igual, así que va cacheado. El turno (historial y
// mensajes nuevos) va en el mensaje del usuario: es lo único que cambia entre pedidos.
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const QUIEN = ["dev", "estudia", "no_dev", "construye", "empresa", "no_se_sabe"];
const BUSCA = ["si", "no", "todavia_no", "abierto", "no_se_sabe"];
const ETAPA = [
  "apertura", "quien_es", "si_busca", "como_va", "por_que", "profundizar", "puente",
  "seguimiento", "precio", "cerrada", "de_cande",
];

/** El formato que el prompt le pide al modelo. Con salida estructurada vuelve siempre válido. */
export const Salida = z.object({
  accion: z.enum(["responder", "callar", "pasar_a_cande"]),
  mensajes: z.array(z.string()),
  estado: z.object({
    quien: z.enum(QUIEN),
    busca: z.enum(BUSCA),
    dolor: z.string(),
    etapa: z.enum(ETAPA),
    link_formulario_enviado: z.boolean(),
    precio_dicho: z.boolean(),
  }),
  aviso_para_cande: z.string(),
  seguimiento_en_horas: z.number().nullable(),
  motivo: z.string(),
});

// El esquema que viaja a la API se arma con zod y no con el helper del SDK (betaZodOutputFormat):
// el helper de la 0.133 pasa los enum a texto adentro de "description", y entonces la API no
// obliga a que accion, quien, busca y etapa salgan de la lista. z.toJSONSchema los manda como
// enum, con additionalProperties en false en cada objeto.
function esquemaDeSalida() {
  const esquema = z.toJSONSchema(Salida);
  delete esquema.$schema;
  return esquema;
}

// `parse` es lo que usa el SDK para leer el texto de la respuesta. No tira: un JSON cortado da
// null, así se llega a mirar stop_reason y el motivo que le llega a Cande es el verdadero.
const FORMATO = {
  type: "json_schema",
  schema: esquemaDeSalida(),
  parse: (texto) => {
    try {
      return JSON.parse(texto);
    } catch {
      return null;
    }
  },
};

/**
 * El modelo no dio una salida para este turno. Sea cual sea, el mensaje del lead queda en espera: la
 * charla sigue del agente, sin aviso, y el cron de la espera la reintenta (ver lib/dm/seguimientos.js).
 * `general`: le pasa a cualquier charla (el modelo no está, la Mac se quedó sin uso): no cuenta para el
 * tope de esa charla, y los crons dejan de arrancar toques y reintentos en esa corrida (fallarían
 * igual). Es lo que se supone si no se sabe; solo un rechazo, un corte o un formato inválido de este
 * turno son de esta charla (general: false): esos sí cuentan, y a las 3 la charla pasa a Cande.
 * `dudosa` (con general): la Mac contestó con un error que puede ser de su Claude o de esta charla (no
 * pudo, no devolvió JSON, tardó de más). Cuenta para el tope solo si en ese rato otras charlas salieron
 * bien (base.sinContestar), y una sola no corta la corrida: hacen falta dos seguidas (seguimientos.js).
 * `transitorio`: además se arregla sola en minutos (la Mac sin red, Anthropic caído o saturado).
 */
export class ModeloNoContesto extends Error {
  constructor(mensaje, { transitorio = false, general = true, dudosa = false } = {}) {
    super(mensaje);
    this.transitorio = transitorio;
    this.general = general;
    this.dudosa = general !== false && dudosa === true;
  }
}

let cliente = null;

// Si los filtros de seguridad del modelo rechazan un pedido, Anthropic lo reintenta solo en
// el modelo que recomienda (fallbacks: "default"). Es un beta: si la API lo rechaza, se
// sigue sin eso y un rechazo es una falla de esa charla: se reintenta y a la tercera la charla pasa
// a Cande, que es lo seguro.
// Sin clave no se pudo probar: se confirma en la primera prueba real.
const BETA_FALLBACK = "server-side-fallback-2026-07-01";
let conFallback = true;

/**
 * Devuelve la salida del agente para un turno. Tira ModeloNoContesto si el modelo se negó, se cortó
 * o devolvió algo que no se pudo leer (de esta charla), o si no se pudo llegar a Anthropic (general).
 * En los dos casos el mensaje del lead queda en espera (ver ModeloNoContesto).
 */
export async function pedir({ prompt, turno }) {
  cliente ||= new Anthropic();
  const pedido = {
    model: process.env.DM_MODELO || "claude-opus-5-5",
    max_tokens: 16000,
    output_config: { effort: process.env.DM_ESFUERZO || "medium", format: FORMATO },
    system: [{ type: "text", text: prompt, cache_control: { type: "ephemeral", ttl: "1h" } }],
    messages: [{ role: "user", content: JSON.stringify(turno) }],
  };
  // 45 segundos y un reintento: 91 como mucho. Tiene que entrar, con la espera de la ráfaga y
  // la de la traba, en los 300 segundos que vive la función (ver lib/dm/agente.js).
  const opciones = { timeout: 45_000, maxRetries: 1 };
  let r;
  try {
    try {
      r = await cliente.beta.messages.parse(
        conFallback ? { ...pedido, betas: [BETA_FALLBACK], fallbacks: "default" } : pedido, opciones);
    } catch (e) {
      if (!(conFallback && e instanceof Anthropic.BadRequestError)) throw e;
      r = await cliente.beta.messages.parse(pedido, opciones);
      // Se apaga recién acá, cuando el mismo pedido sin fallbacks anduvo: el 400 era por el beta.
      // Un 400 por otra cosa (saldo, modelo mal cargado) falla también sin fallbacks y no lo apaga.
      conFallback = false;
    }
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new ModeloNoContesto("la clave de Anthropic no es válida");
    if (e instanceof Anthropic.RateLimitError) throw new ModeloNoContesto("Anthropic: límite de pedidos", { transitorio: true });
    // Los cortes de red no traen status: van antes que APIError para no informar "contestó undefined".
    if (e instanceof Anthropic.APIConnectionTimeoutError) throw new ModeloNoContesto("Anthropic no contestó a tiempo", { transitorio: true });
    if (e instanceof Anthropic.APIConnectionError) throw new ModeloNoContesto("no se pudo conectar con Anthropic", { transitorio: true });
    if (e instanceof Anthropic.APIError) {
      throw new ModeloNoContesto(`Anthropic contestó ${e.status}: ${e.message}`, { transitorio: e.status >= 500 });
    }
    throw new ModeloNoContesto(`no se pudo llamar a Anthropic: ${e.message}`);
  }
  if (r.stop_reason === "refusal") throw new ModeloNoContesto("el modelo no quiso contestar este turno", { general: false });
  if (r.stop_reason === "max_tokens") throw new ModeloNoContesto("la respuesta se cortó", { general: false });
  const leida = Salida.safeParse(r.parsed_output);
  if (!leida.success) {
    const campos = leida.error.issues.map((i) => i.path.join(".") || "(todo)").join(", ");
    throw new ModeloNoContesto(`la respuesta no cumple el formato: ${campos}`, { general: false });
  }
  return { ...leida.data, _uso: r.usage };
}
