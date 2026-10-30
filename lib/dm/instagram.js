// Lectura directa de Instagram, para dos reglas que ManyChat no puede ver (16/10, Cande):
//   1. "si yo sigo a la persona no se meta": si la cuenta sigue al lead, el agente sale.
//   2. "--" escrito por ella en el chat desde la app de Instagram saca al agente de esa charla.
// ManyChat no ve lo que ella escribe desde la app ni a quién sigue, así que esto lee Instagram
// con su propio permiso: la API de Instagram con inicio de sesión de Instagram (graph.instagram.com),
// con los permisos instagram_business_basic e instagram_business_manage_messages. Solo lee:
// los mensajes siguen saliendo por ManyChat.
//
// Config en Vercel: INSTAGRAM_TOKEN, el token largo (60 días) que genera Cande en su app de Meta.
// Nunca se registra ni se devuelve. Se renueva solo (ver renovar) y el renovado queda en la base.
// Sin token no hace nada; con token, las reglas corren recién con el ajuste "instagram" en true.
//
// Sin webhooks: para recibir mensajes de leads la app tendría que estar publicada, con acceso
// avanzado y la empresa verificada. Se lee la bandeja (la API de conversaciones) cuando hace falta.
//
// Si Instagram falla, el agente sigue como siempre (las reglas no frenan nada) y a Cande le llega
// un aviso por día como mucho. Todo entra por parámetro para probarlo sin red.
import { createHash, randomUUID } from "node:crypto";
import { esCodigoSalir } from "./respuestas";

const API = "https://graph.instagram.com/v25.0";
// El otro camino (17/10): el permiso con el que el sitio ya publica en Instagram (tokens_redes "ig", lo
// sube el dashboard y lo renueva) tiene instagram_manage_messages. Con la página de Facebook de la
// cuenta se leen las mismas charlas, sin crear otra app ni pegar otro token.
const GRAPH_FB = "https://graph.facebook.com/v23.0";
const RENOVAR = "https://graph.instagram.com/refresh_access_token";
const DIA = 86400000;
const ESPERA_MS = 12000; // cada pedido a Instagram
const ESPERA_LISTA_MS = 25000; // la lista de charlas con sus mensajes (solo la piden el cron y la búsqueda de un contacto)
const RENOVAR_CADA = 7 * DIA; // el token dura 60 días: se renueva una vez por semana
const AVISO_CADA = DIA; // si la conexión falla, a Cande le llega un aviso por día como mucho
const MENSAJES_POR_HILO = 10; // Instagram da el detalle de los últimos 20 mensajes de cada charla

export const hayInstagram = () => Boolean(process.env.INSTAGRAM_TOKEN);

const huella = (texto) => createHash("sha256").update(String(texto)).digest("hex");
/** El link que abre la charla con esa persona en Instagram (en el celu abre la app). */
export const linkCharlaIg = (usuario) => (/^[a-z0-9._]{1,30}$/.test(String(usuario || "")) ? `https://ig.me/m/${usuario}` : null);

/**
 * El usuario de Instagram de un contacto para el link del aviso: el guardado o, si no se sabe, el que da
 * ManyChat (y queda guardado). Nunca tira: sin usuario, el aviso sale sin link.
 */
export async function usuarioParaAviso(c, { base, manychat }) {
  try {
    if (c?.ig_usuario != null) return c.ig_usuario || null;
    if (!c?.id || !manychat?.datosDe) return null;
    const d = await manychat.datosDe(c.id);
    if (!d?.ok) return null;
    const usuario = usuarioIg(d.ig_username);
    try {
      await base.guardarIg(c.id, { usuario });
    } catch {
      // queda para la próxima
    }
    return usuario || null;
  } catch {
    return null;
  }
}

/** Un usuario de Instagram como se guarda y se compara: sin @ y en minúscula. */
export const usuarioIg = (s) => String(s || "").trim().replace(/^@/, "").toLowerCase();
const minuscula = usuarioIg;

/** Instagram manda las fechas como "2026-10-17T12:00:00+0000" o como segundos. */
export function fechaDe(valor) {
  if (valor == null || valor === "") return null;
  if (typeof valor === "number" || /^\d+$/.test(String(valor))) {
    const n = Number(valor);
    return new Date(n < 1e12 ? n * 1000 : n);
  }
  const d = new Date(String(valor).replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Un error de Instagram con su código: 190 es token vencido o revocado. */
export class ErrorInstagram extends Error {
  // `subcode` es el error_subcode de Meta: con code -1 ("error interno inesperado") el motivo real
  // viene solo ahí (una private reply fuera de los 7 días es -1 con subcode 2534024).
  constructor(mensaje, { code = null, subcode = null, status = null, demora = false } = {}) {
    super(mensaje);
    this.code = code;
    this.subcode = subcode;
    this.status = status;
    this.demora = demora;
  }
}

/** Lo que se le dice a Cande cuando la conexión no anda. */
export function explicarError(e) {
  if (e?.code === 190) return "el token de Instagram venció o se revocó: generá uno nuevo en tu app de Meta y pegalo en Vercel (INSTAGRAM_TOKEN)";
  if (e?.code === 10 || e?.code === 200 || e?.code === 230) return `Instagram no da permiso para leer esto (${e.message})`;
  if ([4, 17, 32, 613, 80002].includes(e?.code)) return "Instagram pidió que se le pregunte más despacio: se reintenta solo";
  return e?.message || "no sé por qué";
}

/**
 * La charla como la devuelve Instagram, ya ordenada: quién es la otra persona y sus últimos
 * mensajes (los más nuevos primero). La otra persona sale de los mensajes: el que no es la cuenta.
 */
export function leerHilo(crudo, cuenta) {
  const mensajes = (crudo?.messages?.data || []).map((m) => ({
    id: m.id,
    creado: fechaDe(m.created_time),
    de: m.from ? { id: String(m.from.id ?? ""), usuario: minuscula(m.from.username) } : null,
    para: (m.to?.data || []).map((p) => ({ id: String(p.id ?? ""), usuario: minuscula(p.username) })),
    texto: typeof m.message === "string" ? m.message : null,
  }));
  const esCuenta = (p) => esDeLaCuenta(p, cuenta);
  let otro = null;
  for (const m of mensajes) {
    const candidatos = [m.de, ...m.para].filter((p) => p && (p.id || p.usuario) && !esCuenta(p));
    if (candidatos.length) {
      otro = candidatos[0];
      break;
    }
  }
  return { id: crudo?.id, actualizado: fechaDe(crudo?.updated_time), otro, mensajes };
}

/** Si lo escribió la cuenta de Cande (por id o, si el id no coincide, por usuario). */
export function esDeLaCuenta(p, cuenta) {
  if (!p || !cuenta) return false;
  return (Boolean(p.id) && p.id === String(cuenta.user_id)) || (Boolean(p.usuario) && p.usuario === minuscula(cuenta.username));
}

/**
 * Desde cuándo cuenta un "--" en la charla de este contacto: desde que la charla es de quien es
 * ahora (si volvió al agente con /agente, el "--" de antes ya se usó). En un alta todavía sin
 * confirmar cuenta cualquiera: pudo escribirlo antes de que la persona entrara a la base.
 */
export const desdeDe = (c) => (c.alta_avisada === false || !c.dueno_desde ? null : new Date(c.dueno_desde));

/** Un texto para comparar: sin tildes, sin mayúsculas, sin signos ni emojis. */
export const claveTexto = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** Si un mensaje que salió de la cuenta es uno de los conocidos (lo mandó el agente, un automático o ya está anotado). */
function esConocido(texto, claves) {
  const k = claveTexto(texto);
  if (k.length < 4) return true; // un emoji, un "ok": no dice nada
  return claves.some((c) => c && (c.includes(k.slice(0, 50)) || k.includes(c.slice(0, 50))));
}

/**
 * Si un texto de la cuenta es uno de los conocidos: igual, o con 30 letras iguales al principio o al final (el nombre de
 * la persona en el medio). Lo usa la red de la bandeja (lib/dm/bandeja.js, que lo reexporta) y la marca de retomada.
 */
export function esConocida(k, conocidas) {
  return conocidas.some((c) => c === k || (Math.min(k.length, c.length) >= 30 &&
    (c.includes(k.slice(0, 30)) || c.includes(k.slice(-30)) || k.includes(c.slice(0, 30)) || k.includes(c.slice(-30)))));
}

/**
 * Si un texto que salió de la cuenta es uno de los automáticos (claves de claveTexto). "Cande aquí" al principio es
 * ella, salvo que sea ese automático tal cual (el del CV arranca igual). Un texto corto, un emoji o nada no es
 * ningún automático.
 */
export function esAutomatico(texto, automaticos) {
  const k = claveTexto(texto);
  if (k.length < 4) return false;
  if (k.startsWith("candeaqui")) return automaticos.includes(k);
  return esConocida(k, automaticos);
}

/**
 * En una charla retomada, si un mensaje que la cuenta escribió con la marca puesta (escritoConLaMarca) es uno de los
 * conocidos: si es igual (la clave entera) a algo que la cuenta mandó desde que se marcó (`recientes`, un Set de
 * claves), o si es uno de los automáticos cargados (`automaticos`, claves de dm_config "automaticos") con algo cambiado,
 * como los reconoce la red de la bandeja (esAutomatico: el nombre de la persona adentro, otra versión del mismo texto).
 * Sin eso, un automático que ManyChat mandó apenas distinto del cargado (uno que salta cuando el lead escribe una
 * palabra clave, con su nombre adentro) se tomaba por lo que pegó Cande: gastaba la marca o dejaba contestado lo del
 * lead (revisión del 21/10, tercera vuelta). Un emoji o un "ok" no dice nada, como siempre.
 */
function esConocidoConLaMarca(texto, recientes, automaticos = []) {
  const k = claveTexto(texto);
  return k.length < 4 || recientes.has(k) || esAutomatico(texto, automaticos);
}

/**
 * Un mensaje que Cande escribió a mano en la charla (desde Instagram o la Bandeja de ManyChat) después
 * de `desde`: sale de la cuenta y no es nada que haya mandado el agente ni un automático. Cande, 17/10:
 * "me metí en una charla que la venía llevando re bien y de repente te metés". Si hay varios, el más nuevo.
 */
export function manualEnHilo(hilo, cuenta, conocidos, desde) {
  return manualesEnHilo(hilo, cuenta, conocidos, desde).at(-1) || null;
}

/**
 * Todos los mensajes que Cande escribió a mano en la charla después de `desde` (ver manualEnHilo), del más viejo al más
 * nuevo. Con `conMarca` (de conLaMarca), lo que la cuenta escribió con la marca de retomada puesta se mira con la regla
 * de la marca (esConocidoConLaMarca); lo demás, como siempre.
 */
export function manualesEnHilo(hilo, cuenta, conocidos, desde, conMarca = null) {
  const claves = conocidos.map(claveTexto).filter((c) => c.length >= 4);
  const recientes = new Set((conMarca?.recientes || []).map(claveTexto));
  const automaticos = (conMarca?.automaticos || []).map(claveTexto).filter((k) => k.length >= 4);
  const aMano = (m) => (conMarca && escritoConLaMarca(conMarca.marca, m)
    ? !esConocidoConLaMarca(m.texto, recientes, automaticos)
    : esCandeAqui(m.texto, claves) || !esConocido(m.texto, claves));
  return hilo.mensajes.filter((m) =>
    esDeLaCuenta(m.de, cuenta) && m.texto && !esCodigoSalir(m.texto) && desde && m.creado && m.creado > desde && aMano(m)).reverse();
}

/*
 * Charlas retomadas (20/10). Cande contesta a mano, desde el celular, charlas viejas (más de 24 h: la API ya no deja
 * escribirles) y quiere que después las siga el agente: "yo no me voy a meter en 150 conversaciones". En una charla
 * del agente marcada como retomada, lo que ella escribió a mano con la marca puesta no saca al agente: queda anotado
 * como suyo con el texto tal cual de Instagram (una sola vez: cada mensaje lleva su id de Instagram), lo que el lead
 * había escrito hasta ahí queda contestado (el agente no le contesta encima), lo que estaba esperando que ManyChat lo
 * retire y contestaba algo de antes de ella ya no sale (lib/dm/base.js, anotarCandeDesdeIg) y, cuando el lead escriba,
 * contesta el agente con todo eso a la vista. Su "--" la saca igual: manda sobre la marca. Fuera de las charlas
 * marcadas, todo sigue como siempre.
 *
 * La marca sirve UNA vez (revisión del 21/10): cuando se anota lo que pegó, la marca queda usada hasta lo último que se
 * anotó (anotarCandeDesdeIg le pone "usada"). Lo que escriba a mano después saca al agente como siempre (lo que pidió el
 * 17/10: "me metí en una charla que la venía llevando re bien y de repente te metés"). Lo que escribió con la marca
 * vigente cuenta aunque se vea después de que venció (cubreLaMarca mira la hora del mensaje, no la de ahora): si nadie
 * lo anotó a tiempo y el lead contesta el día 8, se anota igual y contesta el agente.
 *
 * Lo que pegó se reconoce por la hora (revisión del 21/10): con la marca vigente y sin usar, lo que la cuenta escribió
 * después de que se marcó cuenta como escrito a mano, salvo que sea igual (la clave entera) a algo que la cuenta mandó
 * desde esa hora: lo del agente, lo ya anotado o un automático (escritoConLaMarca y conLaMarca). Comparado como
 * siempre (esConocido), un mensaje corto viejo de la cuenta en la historia sembrada ("Perdón", "Que te parece?") hacía
 * conocido todo lo que lo contuviera, y lo que ella pegaba no se anotaba nunca. Sin la marca, con la marca usada o
 * antes de que se marcara, todo se compara como siempre: ahí no cambia nada.
 *
 * El orden es: la charla del agente ("dueno" o "sembrar", sin el mensaje de ella al final), la marca, y recién
 * después ella pega. Lo que escribió antes de que la charla fuera del agente no cuenta (desdeManual). Lo que va a
 * pegar NO se anota antes: lo anota la marca con lo que de verdad salió, cuando lo ve la vuelta del cron, la mirada
 * de cada respuesta o la red de la bandeja. Anotado antes, si el lead escribe antes de que ella pegue o si ella
 * saltea la charla, el agente lo da por dicho sin que haya salido (revisión del 21/10). Necesita el ajuste
 * "instagram" prendido: sin eso nadie mira lo que ella escribe.
 *
 * La marca vive en dm_config "retomadas": { [contacto]: { hasta: ms, marcada: ms, usada?: ms } }. `marcada` es la
 * hora en que se marcó. La pone /api/dm/config (retomar_marcar; marcarla de nuevo la deja sin usar y, si seguía
 * vigente y sin usar, con la hora de la primera vez), y retomar_estado dice, en el momento en que se lo pregunta, en
 * cuáles todavía le toca pegar.
 *
 * Todo lo nuevo corre SOLO en una charla con la marca (revisión del 21/10, tercera vuelta): tieneMarcaDeRetomada para
 * el agente, el controlador y --retomar; marcaParaElHilo para la mirada, el cron y la red de la bandeja. En una charla
 * sin marca, y también si la base no deja leer la marca, todo hace lo mismo que en main, con los mismos avisos: el
 * orden de los mensajes, qué se mira después de la mirada, cuándo sale un toque, qué pasa si la base falla. Si no se
 * puede leer la marca, lo escrito a mano saca al agente como siempre aunque la charla esté marcada: es el precio de no
 * tocar nada en las demás.
 */
export const CLAVE_RETOMADAS = "retomadas";
/**
 * Lo que dice porQueSale en una charla retomada cuando la base no deja leer lo que mandó la cuenta o anotar lo que
 * Cande escribió a mano: el agente no contesta ahora (no le escribe encima) ni sale (es de las que ella quiere que
 * siga). El turno queda abierto y la espera lo mira de nuevo en unos minutos. Sale solo de una charla con la marca: si
 * no se puede leer la marca, la charla se mira como en main.
 */
export const NO_AHORA = "Cande escribió a mano y no se pudo anotar: se mira de nuevo en unos minutos";
/** Lo que dura la marca si no se dice otra cosa. */
export const DIAS_RETOMADA = 7;

/**
 * La marca de retomada de este contacto, o null: { hasta, marcada, usada } en ms. `marcada` es la hora en que se marcó
 * (null si no se sabe). `usada` es la hora de lo último que se anotó con ella (null: todavía no se usó). `retomadas`:
 * dm_config "retomadas".
 */
export function marcaDe(retomadas, id) {
  const x = retomadas?.[String(id)];
  const hasta = Number(x?.hasta);
  if (!Number.isFinite(hasta)) return null;
  const marcada = x.marcada == null || !Number.isFinite(Number(x.marcada)) ? null : Number(x.marcada);
  if (x.usada == null) return { hasta, marcada, usada: null };
  const usada = Number(x.usada);
  return { hasta, marcada, usada: Number.isFinite(usada) ? usada : -Infinity }; // una marca usada que no se entiende ya no cubre nada
}

/** Si la charla de este contacto tiene la marca de retomada vigente y sin usar: a Cande todavía le toca pegar ahí. */
export function esRetomada(retomadas, id, ahora = new Date()) {
  const m = marcaDe(retomadas, id);
  return Boolean(m) && m.hasta > ahora.getTime() && m.usada === null;
}

/**
 * Si la marca (de marcaDe) cubre este mensaje de Cande (de manualesEnHilo): lo escribió antes de que la marca venciera
 * y, si la marca ya se usó, no después de lo que se anotó esa vez. Mira la hora del mensaje, no la de ahora.
 *
 * Queda abierto, a propósito (revisión del 21/10, tercera vuelta): si Cande manda dos mensajes seguidos al pegar (otra
 * burbuja, una corrección), que el segundo se anote o saque al agente depende de si alguna mirada corrió entre los dos.
 * Si ninguna corrió, los dos quedan cubiertos (la marca se usa hasta el último); si corrió, la marca ya quedó usada
 * hasta el primero y el segundo la saca ("le escribiste vos"). No se cambió porque no es simple ni seguro: decidir
 * hasta dónde llega "lo pegado" (unos minutos, o hasta que conteste el lead) es decidir cómo trabaja ella, cualquier
 * ventana sería a ojo, y las dos cosas que sí están pedidas quedan fijas en las pruebas (lo que pegó en varias burbujas
 * antes de que se mirara se anota; lo que escribe a mano después de lo anotado saca al agente). Con un solo mensaje
 * pegado por charla, que es lo previsto, no pasa; si pasa, lo peor es que la charla vuelve a ella, como sin la marca.
 */
export function cubreLaMarca(marca, m) {
  const t = m?.creado ? new Date(m.creado).getTime() : NaN;
  return Boolean(marca) && Number.isFinite(t) && t < marca.hasta && (marca.usada === null || t <= marca.usada);
}

/**
 * Si este mensaje de la cuenta se escribió con la marca de retomada (de marcaDe) puesta y sin usar: después de que se
 * marcó y antes de que venciera. Mira la hora del mensaje, no la de ahora. Una marca ya usada, o sin la hora en que se
 * marcó, no cubre nada acá: lo que escribió la cuenta se compara como siempre.
 */
export function escritoConLaMarca(marca, m) {
  const t = m?.creado ? new Date(m.creado).getTime() : NaN;
  return Boolean(marca) && marca.usada === null && marca.marcada !== null && Number.isFinite(t) && t > marca.marcada && t < marca.hasta;
}

/**
 * Si la charla de `id` tiene una marca de retomada que cuenta: vigente (no venció, se haya usado o no) o usada antes de
 * vencer. Lo que el agente, el controlador y --retomar hacen distinto en una charla retomada corre solo con esto en
 * true. Sin marca, o con una que venció sin usarse, la charla es como cualquier otra (como en main).
 */
export function tieneMarcaDeRetomada(retomadas, id, ahora = new Date()) {
  const m = marcaDe(retomadas, id);
  return Boolean(m) && (m.hasta > ahora.getTime() || (m.usada !== null && m.usada < m.hasta));
}

/**
 * La marca con la que se mira lo que escribió la cuenta en el hilo de la charla de `c` (la mirada, el cron, la red de la
 * bandeja), o null: entonces el hilo se mira como en main. Solo en una charla del agente: en una de Cande no hay nada
 * que anotar. Cuenta la que tiene la charla (tieneMarcaDeRetomada) y también una que venció sin usarse si en el hilo hay
 * algo de la cuenta escrito antes de que venciera (lo pegó con la marca vigente y nadie lo vio a tiempo: cubreLaMarca).
 */
export function marcaParaElHilo(retomadas, c, hilo, cuenta, ahora = new Date()) {
  const marca = marcaDe(retomadas, c?.id);
  if (!marca || c?.dueno !== "agente") return null;
  if (tieneMarcaDeRetomada(retomadas, c.id, ahora)) return marca;
  const desde = desdeManual(c);
  const conElla = marca.usada === null && Boolean(desde) && hilo.mensajes.some((m) =>
    esDeLaCuenta(m.de, cuenta) && m.texto && !esCodigoSalir(m.texto) && m.creado && m.creado > desde && cubreLaMarca(marca, m));
  return conElla ? marca : null;
}

/**
 * Lo que hace falta para mirar con la marca de retomada lo que escribió la cuenta en la charla de `c` (manualesEnHilo):
 * { marca, recientes, automaticos }, con lo que la cuenta mandó en la charla desde que se marcó (`textosDeLaCuenta` es
 * el de lib/dm/base.js, con `desde`: lo del agente, lo anotado y los automáticos) y los textos de los automáticos
 * cargados (`leerAutomaticos`, dm_config "automaticos": esConocidoConLaMarca los reconoce aunque ManyChat los mande con
 * algo cambiado). Es null, sin preguntarle nada a la base, si nada de lo que escribió la cuenta en el hilo se escribió
 * con la marca puesta (escritoConLaMarca): entonces todo se compara como siempre. `retomadas`: dm_config "retomadas".
 * Si la base no contesta, tira: quien llama decide.
 */
export async function conLaMarca(hilo, cuenta, c, retomadas, textosDeLaCuenta, leerAutomaticos = async () => []) {
  const marca = marcaDe(retomadas, c?.id);
  if (!marca || !hilo.mensajes.some((m) => esDeLaCuenta(m.de, cuenta) && m.texto && escritoConLaMarca(marca, m))) return null;
  const [recientes, automaticos] = await Promise.all([textosDeLaCuenta(c.id, { desde: new Date(marca.marcada) }), leerAutomaticos()]);
  return { marca, recientes, automaticos: Array.isArray(automaticos) ? automaticos : [] };
}

/** Los textos de los automáticos cargados (dm_config "automaticos"), con el `leerConfig` de lib/dm/base.js. Si la base no contesta, tira. */
export const automaticosCargados = (leerConfig) => async () => (await leerConfig("automaticos"))?.textos || [];

/** Si la cuenta escribió algo en la charla desde `desde` (sin contar el "--"): solo entonces hace falta mirar la marca. */
export function escribioLaCuenta(hilo, cuenta, desde) {
  return Boolean(desde) && hilo.mensajes.some((m) =>
    esDeLaCuenta(m.de, cuenta) && m.texto && !esCodigoSalir(m.texto) && m.creado && m.creado > desde);
}

/**
 * Si lo que Cande escribió a mano en la charla de `c` (`manuales`, de manualesEnHilo) se anota como suyo y la charla
 * sigue del agente: solo si la charla es del agente (si ya es de Cande, que ella escriba es lo de siempre y no hay nada
 * que anotar) y si la marca cubre todo (cubreLaMarca). Si no, lo escrito a mano saca al agente.
 */
export function seAnotaComoRetomada(c, manuales, retomadas) {
  const marca = marcaDe(retomadas, c?.id);
  // "Cande aquí" es su código para quedarse con la charla (17/10): con la marca puesta también saca al agente. El 21/10
  // lo escribió en una charla retomada, se tomó como lo pegado y el agente siguió contestándole al lead.
  if (manuales.some((m) => claveTexto(m?.texto).startsWith("candeaqui"))) return false;
  return c?.dueno === "agente" && manuales.length > 0 && manuales.every((m) => cubreLaMarca(marca, m));
}

/**
 * Lo que Cande escribió a mano en la charla de `c` (manualesEnHilo, con la marca a la vista: `conMarca`, de conLaMarca).
 * Para las vueltas que miran muchas charlas a la vez (el cron de Instagram, la red de la bandeja), sin lo que salió
 * igual en otras charlas de la vuelta (`plantillas`, de plantillasDe: un automático), salvo lo que cubre la marca de
 * retomada. Cande pega el mismo texto en varias charlas: eso es suyo y se anota (revisión del 21/10). `conocidos`: los
 * de base.textosDeLaCuenta.
 */
export function manualesConPlantillas(hilo, cuenta, c, { conocidos, plantillas = [], retomadas = null, conMarca = null }) {
  const desde = desdeManual(c);
  const marca = marcaDe(retomadas, c.id);
  const sinPlantillas = new Set(manualesEnHilo(hilo, cuenta, [...conocidos, ...plantillas], desde, conMarca));
  return manualesEnHilo(hilo, cuenta, conocidos, desde, conMarca).filter((m) => sinPlantillas.has(m) || cubreLaMarca(marca, m));
}

/**
 * Si a Cande todavía le toca pegar su mensaje en esta charla retomada (retomar_estado). Vale en el momento en que se
 * pregunta: se pregunta justo antes de copiar, no con lo que se miró hace un rato (el lead pudo escribir a la mañana y
 * el agente ya contestarle). `fila` es la de base.estadoRetomadas, o null si la charla no está en la base. No le toca
 * si la charla no es del agente, si la cuenta ya le escribió después del último mensaje del lead (le contestó el agente,
 * o ya pegó ella y se anotó), si el agente está por contestar o si la charla no tiene la marca vigente y sin usar (sin
 * la marca, lo que pegue saca al agente). `motivo` dice por qué no.
 * Lo último de cada lado se compara por la hora y, a la misma hora, por el orden en la base (los ids): lo sembrado
 * (base.sembrar) queda todo con la misma hora, y con la hora sola lo de la cuenta parecía posterior al lead.
 */
export function paraPegar(id, fila, retomadas, ahora = new Date()) {
  const hora = (x) => (x ? new Date(x) : null);
  const lead = hora(fila?.ultimo_del_lead);
  const cuenta = hora(fila?.ultimo_de_la_cuenta);
  const retomada = esRetomada(retomadas, id, ahora);
  const r = (motivo) => ({
    contacto: String(id), pegar: motivo === null, motivo, retomada,
    ultimo_del_lead: lead?.toISOString() ?? null, ultimo_de_la_cuenta: cuenta?.toISOString() ?? null,
  });
  const idDe = (x) => (x == null || x === "" ? 0 : Number(x) || 0);
  const cuentaDespues = cuenta && (!lead || cuenta > lead ||
    (cuenta.getTime() === lead.getTime() && idDe(fila?.id_ultimo_de_la_cuenta) > idDe(fila?.id_ultimo_del_lead)));
  if (!fila) return r("no está en la base");
  if (fila.dueno !== "agente") return r("no es del agente");
  if (cuentaDespues) return r("ya le escribió la cuenta");
  if (fila.por_salir) return r("el agente está por contestar");
  if (!retomada) return r("no tiene la marca de retomada");
  return r(null);
}

/** Un mensaje de Cande en Instagram, como lo anota la base (anotarCandeDesdeIg): su texto tal cual, la hora en que salió y su id. */
export const paraAnotarDeCande = (m) => ({ texto: String(m.texto).trim().slice(0, 4000), creado: new Date(m.creado).toISOString(), mid: String(m.id) });

/**
 * "Cande aquí" al principio del mensaje es Cande presentándose (17/10: "podemos poner como código Cande
 * aquí"). Cuenta aunque se parezca a un automático, salvo que sea ese automático tal cual (el del CV
 * arranca igual).
 */
function esCandeAqui(texto, claves) {
  const k = claveTexto(texto);
  return k.startsWith("candeaqui") && !claves.includes(k);
}

/** Desde cuándo cuenta un mensaje a mano de Cande: desde que la charla es del agente (lo de antes ya lo sabía). */
export function desdeManual(c) {
  const fechas = [c.dueno_desde, c.alta_en].filter(Boolean).map((f) => new Date(f).getTime());
  return fechas.length ? new Date(Math.max(...fechas)) : null;
}

/** El "--" (o /yo) que escribió Cande en la charla después de `desde` (null: en cualquier momento). */
export function codigoEnHilo(hilo, cuenta, desde = null) {
  return hilo.mensajes.find((m) =>
    esDeLaCuenta(m.de, cuenta) && m.texto != null && esCodigoSalir(m.texto) && (!desde || (m.creado && m.creado > desde))) || null;
}

/** Cuántos mensajes de la charla de Instagram de antes de la base le llegan al modelo, como mucho (charlaPrevia). */
export const MAX_PREVIO = 20;
/**
 * Lo que tarda en guardarse lo que entra por ManyChat después de la hora de Instagram. Sirve para encontrar en el hilo
 * el mensaje del lead que es lo primero guardado (no puede ser posterior a su hora en la base más este margen) y, solo
 * si no se encuentra, como respaldo para lo del lead: lo que escribió en ese rato es el turno de ahora.
 */
export const MARGEN_PREVIO_MS = 30000;
/**
 * De cuántos días antes de lo primero guardado entra lo de antes. Lo más viejo es otra charla: un "no me escribas más" de
 * hace meses no es de hoy, y borrarViejas (lib/dm/base.js) ya borra a los 90 días para que el modelo arranque de cero.
 */
export const DIAS_PREVIO = 14;

/**
 * Lo que se habló en la charla de Instagram antes de que entrara a la base (30/10: el lead ya había contado a qué venía
 * y Cande le había preguntado a mano si era programador; la charla entró a la base recién con la respuesta del lead, y
 * el agente le volvió a preguntar si era dev). `hilo` y `cuenta` son los que leyó porQueSale; `guardados`, lo que hay en la
 * base de esa charla ({ id, quien, texto, creado, ig_mid }).
 * El corte es el mensaje del hilo que es lo primero guardado del lead: el de su ig_mid si lo guardó la red de la bandeja
 * y, si no, el del lead con el mismo texto (claveTexto) más nuevo que no sea posterior a su hora en la base más
 * MARGEN_PREVIO_MS. Entra solo lo anterior a ese mensaje, de los dos lados: la pregunta que Cande hizo a mano segundos
 * antes de esa respuesta entra, y lo que la cuenta mandó después (el automático que contesta ese mensaje), no. Si no se
 * encuentra (no está entre los mensajes que trae Instagram, o llegó con otro texto), lo de la cuenta escrito antes de lo
 * primero guardado y lo del lead escrito antes de eso menos MARGEN_PREVIO_MS.
 * Devuelve esos mensajes con texto, de los últimos DIAS_PREVIO días antes de lo primero guardado, del más viejo al más
 * nuevo y como mucho los `max` más nuevos, como { quien, texto }: "lead" lo de la otra persona y "cande" lo de la cuenta
 * (a mano o un automático). Sin el código para sacar al agente, sin lo que no se sabe quién escribió y sin lo que ya está
 * en la base: el mensaje con el ig_mid de uno guardado, y lo del mismo lado con el mismo texto que se guardó en el bloque
 * del principio (hasta MARGEN_PREVIO_MS después de lo primero guardado: lo sembrado, que tiene todo la misma hora; con el
 * corte, solo lo guardado antes de lo primero del lead), cada guardado una sola vez. Un "Si" de antes sigue entrando
 * aunque el lead conteste "Si" más tarde.
 * El agente lo guarda en la charla la primera vez que lo ve (base.guardarPrevio): Instagram trae solo los últimos
 * mensajes del hilo, y a las pocas vueltas lo de antes ya no está ahí. Sin hilo, sin cuenta o sin la hora de lo
 * guardado: nada.
 */
export function charlaPrevia(hilo, cuenta, guardados, { max = MAX_PREVIO, dias = DIAS_PREVIO } = {}) {
  if (!Array.isArray(hilo?.mensajes) || !hilo.mensajes.length || !cuenta || !Array.isArray(guardados)) return [];
  const hora = (x) => (x ? new Date(x).getTime() : NaN);
  const conHora = guardados.filter((m) => m && Number.isFinite(hora(m.creado)));
  if (!conHora.length) return [];
  const primero = Math.min(...conHora.map((m) => hora(m.creado)));
  const clave = (t) => claveTexto(t) || String(t ?? "").trim();
  const lado = (quien) => (quien === "lead" ? "lead" : ["agente", "cande", "automatico"].includes(quien) ? "cande" : null);
  // El hilo del más viejo al más nuevo. A la misma hora (Instagram da segundos), en el orden en que lo trae: el más nuevo primero.
  const enOrden = hilo.mensajes
    .map((m, i) => ({ m, i, en: hora(m?.creado), texto: typeof m?.texto === "string" ? m.texto.trim() : "" }))
    .filter(({ m, en }) => m?.de && Number.isFinite(en))
    .sort((a, b) => a.en - b.en || b.i - a.i)
    .map((x) => ({ ...x, quien: esDeLaCuenta(x.m.de, cuenta) ? "cande" : "lead" }));
  const primerLead = conHora.filter((m) => m.quien === "lead")
    .sort((a, b) => hora(a.creado) - hora(b.creado) || (Number(a.id) || 0) - (Number(b.id) || 0))[0];
  let corte = -1;
  if (primerLead?.ig_mid) corte = enOrden.findIndex((x) => x.m.id != null && String(x.m.id) === String(primerLead.ig_mid));
  if (primerLead && corte < 0) {
    const k = clave(primerLead.texto);
    const tope = hora(primerLead.creado) + MARGEN_PREVIO_MS;
    corte = enOrden.findLastIndex((x) => x.quien === "lead" && x.texto && x.en <= tope && clave(x.texto) === k);
  }
  const antes = corte >= 0
    ? enOrden.slice(0, corte)
    : enOrden.filter((x) => x.en < (x.quien === "lead" ? primero - MARGEN_PREVIO_MS : primero));
  const mids = new Set(conHora.map((m) => m.ig_mid).filter(Boolean).map(String));
  // Lo guardado al principio, contado: cada uno saca un solo mensaje de antes, el más nuevo con su texto. Con el corte,
  // solo lo guardado antes de lo primero del lead (lo sembrado antes de ese mensaje): ese y lo que sigue ya quedaron del
  // corte para adelante, y contarlos sacaría otro mensaje de antes con el mismo texto.
  const antesDelPrimerLead = (m) => hora(m.creado) < hora(primerLead.creado) ||
    (hora(m.creado) === hora(primerLead.creado) && (Number(m.id) || 0) < (Number(primerLead.id) || 0));
  const ya = new Map();
  for (const m of conHora) {
    if (!lado(m.quien) || hora(m.creado) > primero + MARGEN_PREVIO_MS || (corte >= 0 && !antesDelPrimerLead(m))) continue;
    const k = `${lado(m.quien)}:${clave(m.texto)}`;
    ya.set(k, (ya.get(k) || 0) + 1);
  }
  const desde = primero - dias * DIA;
  const quedan = [];
  for (const x of [...antes].reverse()) {
    if (!x.texto || esCodigoSalir(x.texto) || x.en < desde || (x.m.id != null && mids.has(String(x.m.id)))) continue;
    const k = `${x.quien}:${clave(x.texto)}`;
    if (ya.get(k) > 0) {
      ya.set(k, ya.get(k) - 1);
      continue;
    }
    quedan.push({ quien: x.quien, texto: x.texto.slice(0, 4000) });
  }
  return quedan.slice(0, max).reverse();
}

/**
 * Lo que se guardó de la charla de antes (dm_contactos.previo_ig, ver charlaPrevia), como lo usa el turno: [{ quien,
 * texto }] con quien "lead" o "cande". null si todavía no se guardó (o no es una lista): ese turno lo lee del hilo.
 */
export function previoGuardado(valor) {
  if (!Array.isArray(valor)) return null;
  return valor
    .filter((m) => m && (m.quien === "lead" || m.quien === "cande") && typeof m.texto === "string" && m.texto.trim())
    .map((m) => ({ quien: m.quien, texto: m.texto }));
}

/**
 * El cliente de Instagram. `pedir` es fetch; `config` lee y guarda en dm_config (el token renovado,
 * la cuenta y el estado de la conexión).
 */
export function crearInstagram({
  pedir = (...a) => globalThis.fetch(...a), leerConfig, guardarConfig, tokenEnv = () => process.env.INSTAGRAM_TOKEN,
  reloj = () => new Date(), credencialFb = null,
}) {
  let cuentaGuardada = null;
  let fb = null; // { pagina, token, igId, hasta }: la página de Facebook de la cuenta, con su token

  /** Con credencialFb ({ id de la cuenta de Instagram, token de usuario }), la página y su token. Se guarda una hora. */
  async function conexionFb() {
    if (fb && fb.hasta > Date.now()) return fb;
    const cred = await credencialFb();
    if (!cred?.token || !cred?.id) throw new ErrorInstagram("falta el permiso de Instagram del sitio (lo sube el dashboard)");
    const q = new URLSearchParams({ fields: "id,access_token,instagram_business_account", limit: "100", access_token: cred.token });
    const r = await llamar(`${GRAPH_FB}/me/accounts?${q}`);
    const p = (r.data || []).find((a) => String(a.instagram_business_account?.id || "") === String(cred.id));
    if (!p?.access_token) throw new ErrorInstagram("el permiso de Instagram del sitio no tiene la página de la cuenta");
    fb = { pagina: String(p.id), token: p.access_token, igId: String(cred.id), hasta: Date.now() + 3600000 };
    return fb;
  }
  const rutaCharlas = async () => (credencialFb ? `/${(await conexionFb()).pagina}/conversations` : "/me/conversations");

  /** El token que vale: el renovado, si se renovó a partir del que está en Vercel; si no, el de Vercel. */
  async function token() {
    const env = tokenEnv();
    if (!env) return null;
    const guardado = await leerConfig("instagram_token");
    return guardado?.de === huella(env) && guardado.token ? guardado.token : env;
  }

  async function llamar(url, espera = ESPERA_MS, init = {}) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), espera);
    try {
      const r = await pedir(url, { headers: { Accept: "application/json", ...(init.headers || {}) }, signal: ctrl.signal, ...init });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.error) {
        const e = j.error || {};
        // Sin el token en el mensaje: Instagram a veces lo repite en el error.
        const texto = String(e.message || `Instagram contestó ${r.status}`).replace(/access_token=[^&\s]+/g, "access_token=…");
        throw new ErrorInstagram(texto.slice(0, 200), { code: e.code ?? null, subcode: e.error_subcode ?? null, status: r.status });
      }
      return j;
    } catch (e) {
      if (e instanceof ErrorInstagram) throw e;
      throw new ErrorInstagram(e.name === "AbortError" ? `Instagram tardó más de ${Math.round(espera / 1000)} segundos` : e.message, { demora: true });
    } finally {
      clearTimeout(t);
    }
  }

  async function get(ruta, params = {}, espera = ESPERA_MS) {
    if (credencialFb) {
      const c = await conexionFb();
      return llamar(`${GRAPH_FB}${ruta}?${new URLSearchParams({ ...params, access_token: c.token })}`, espera);
    }
    const t = await token();
    if (!t) throw new ErrorInstagram("falta INSTAGRAM_TOKEN");
    const q = new URLSearchParams({ ...params, access_token: t });
    return llamar(`${API}${ruta}?${q}`, espera);
  }

  /** La cuenta de Cande: user_id es el id con el que figuran sus mensajes. Se guarda una vez. */
  async function cuenta() {
    if (cuentaGuardada) return cuentaGuardada;
    if (credencialFb) {
      const c = await conexionFb();
      const yo = await get(`/${c.igId}`, { fields: "username" });
      return (cuentaGuardada = { user_id: c.igId, username: minuscula(yo.username) });
    }
    const env = huella(tokenEnv() || "");
    const g = await leerConfig("instagram_cuenta");
    if (g?.user_id && g.de === env) return (cuentaGuardada = g);
    const yo = await get("/me", { fields: "user_id,username" });
    cuentaGuardada = { user_id: String(yo.user_id ?? yo.id), username: minuscula(yo.username), de: env };
    await guardarConfig("instagram_cuenta", cuentaGuardada);
    return cuentaGuardada;
  }

  const CAMPOS_HILO = `updated_time,messages.limit(${MENSAJES_POR_HILO}){id,created_time,from,to,message}`;

  /**
   * La charla con el detalle de sus `n` mensajes más nuevos. Si Instagram no los expandió adentro
   * de la charla (la sintaxis anidada no figura en su documentación de esta API), se pide el
   * detalle de cada uno: para saber quién es la otra persona alcanza con uno.
   */
  async function completo(h, n = MENSAJES_POR_HILO) {
    const ms = h.crudo?.messages?.data || [];
    if (!ms.length || ms.slice(0, n).every((m) => m.from)) return h;
    const data = [];
    for (const m of ms.slice(0, n)) {
      try {
        data.push(m.from ? m : await get(`/${m.id}`, { fields: "id,created_time,from,to,message" }));
      } catch (e) {
        // El detalle de los mensajes viejos (más allá de los últimos 20) ya no se puede leer: queda sin
        // texto. Cualquier otra falla (límite de pedidos, token, permiso) corta acá y se avisa.
        if (e?.code !== 100) throw e;
        data.push(m);
      }
    }
    const crudo = { ...h.crudo, messages: { data } };
    return { ...leerHilo(crudo, await cuenta()), crudo };
  }

  /**
   * Una página de la bandeja, las charlas movidas más recientes primero (sin completar: ver completo), y el
   * cursor de la página siguiente (`despues`, null si no hay más). La red de la bandeja (lib/dm/bandeja.js) lee
   * más de una página: una charla que quedó debajo de las primeras 50 no se pierde.
   */
  async function pagina({ limite = 20, mensajes = 5, despues = null } = {}) {
    const yo = await cuenta();
    // La lista con sus mensajes tarda: Meta contestó en 9 segundos con 50 charlas de 10 mensajes (17/10).
    const campos = `updated_time,messages.limit(${mensajes}){id,created_time,from,to,message}`;
    const params = { platform: "instagram", fields: campos, limit: String(limite), ...(despues ? { after: String(despues) } : {}) };
    const r = await get(await rutaCharlas(), params, ESPERA_LISTA_MS);
    const lista = (r.data || []).map((h) => ({ ...leerHilo(h, yo), crudo: h }));
    const siguiente = r.paging?.next && r.paging?.cursors?.after ? String(r.paging.cursors.after) : null;
    return { lista, despues: lista.length ? siguiente : null };
  }

  /** Las charlas de la bandeja, las movidas más recientes primero (sin completar: ver completo). */
  async function hilos({ limite = 20, mensajes = 5 } = {}) {
    return (await pagina({ limite, mensajes })).lista;
  }

  /** La charla con esa persona (por su id de Instagram), completa, o null. */
  async function hiloDe(igsid) {
    const yo = await cuenta();
    const r = await get(await rutaCharlas(), { platform: "instagram", user_id: String(igsid), fields: CAMPOS_HILO });
    const h = (r.data || [])[0];
    return h ? completo({ ...leerHilo(h, yo), crudo: h }) : null;
  }

  const CAMPOS_ADJUNTOS = "id,created_time,from,attachments{image_data{url},video_data{url},file_url}";

  /**
   * Los mensajes de la persona (no los de la cuenta) que traen un adjunto, de los `n` más nuevos de la charla:
   * [{ creado, urls }], los más nuevos primero. Para las fotos que ManyChat entrega sin link (19/10): el
   * agente las mira y, si es el comprobante del pago en pesos, le arma a Cande el borrador del código.
   */
  async function adjuntosDe(igsid, n = MENSAJES_POR_HILO) {
    const yo = await cuenta();
    const r = await get(await rutaCharlas(), { platform: "instagram", user_id: String(igsid), fields: `messages.limit(${n}){${CAMPOS_ADJUNTOS}}` });
    const lista = [];
    for (const m of ((r.data || [])[0]?.messages?.data || []).slice(0, n)) {
      let x = m;
      if (!m.from) {
        try {
          x = await get(`/${m.id}`, { fields: CAMPOS_ADJUNTOS });
        } catch (e) {
          if (e?.code !== 100) throw e; // como en completo: un mensaje viejo que ya no se puede leer se saltea
          continue;
        }
      }
      const de = x.from ? { id: String(x.from.id ?? ""), usuario: minuscula(x.from.username) } : null;
      if (!de || esDeLaCuenta(de, yo)) continue;
      const urls = (x.attachments?.data || []).map((a) => a?.image_data?.url || a?.video_data?.url || a?.file_url).filter(Boolean).map(String);
      if (urls.length) lista.push({ creado: fechaDe(x.created_time), urls });
    }
    return lista;
  }

  /**
   * Usuario de la persona y si la cuenta de Cande la sigue. `conNombre`: también el nombre de su perfil, para
   * buscarla en ManyChat (la red de la bandeja, lib/dm/bandeja.js). Las miradas de cada respuesta no lo piden.
   */
  async function perfil(igsid, { conNombre = false } = {}) {
    const p = await get(`/${encodeURIComponent(igsid)}`, { fields: `${conNombre ? "name," : ""}username,is_business_follow_user` });
    return {
      usuario: minuscula(p.username), laSigue: p.is_business_follow_user === true,
      ...(conNombre ? { nombre: String(p.name || "").replace(/\s+/g, " ").trim() || null } : {}),
    };
  }

  /**
   * Renueva el token si hace una semana que no se renueva. Instagram solo renueva tokens de más de
   * 24 horas: si es más nuevo, falla y se prueba al día siguiente. Devuelve qué pasó.
   */
  async function renovar() {
    if (credencialFb) return { hecho: "lo renueva el dashboard" };
    const env = tokenEnv();
    if (!env) return { hecho: "sin token" };
    const g = await leerConfig("instagram_token");
    const mismo = g?.de === huella(env);
    const ultimo = mismo ? fechaDe(g.intento || g.renovado) : null;
    if (ultimo && reloj() - ultimo < (g.error ? DIA : RENOVAR_CADA)) return { hecho: "no toca" };
    const actual = mismo && g.token ? g.token : env;
    try {
      const r = await llamar(`${RENOVAR}?${new URLSearchParams({ grant_type: "ig_refresh_token", access_token: actual })}`);
      if (!r.access_token) throw new ErrorInstagram("Instagram no devolvió el token renovado");
      const vence = new Date(reloj().getTime() + (Number(r.expires_in) || 60 * 86400) * 1000);
      await guardarConfig("instagram_token", {
        de: huella(env), token: r.access_token, renovado: reloj().toISOString(), intento: reloj().toISOString(), vence: vence.toISOString(),
      });
      return { hecho: "renovado", vence };
    } catch (e) {
      await guardarConfig("instagram_token", {
        ...(mismo ? g : {}), de: huella(env), intento: reloj().toISOString(), error: explicarError(e),
      });
      return { hecho: "falló", error: e };
    }
  }

  /** Cuántos días le quedan al token, si se sabe (lo dice la última renovación). */
  async function diasQueQuedan() {
    if (credencialFb) return null;
    const env = tokenEnv();
    const g = env ? await leerConfig("instagram_token") : null;
    const vence = g?.de === huella(env) ? fechaDe(g.vence) : null;
    return vence ? Math.floor((vence - reloj()) / DIA) : null;
  }

  /** Si el token anda (lee la cuenta, sin lo guardado). Tira el error de Instagram si no. */
  async function anda() {
    if (credencialFb) await cuenta();
    else await get("/me", { fields: "user_id" });
    return true;
  }

  /**
   * Manda un mensaje por DM, con el mismo permiso con el que ya se lee
   * (instagram_business_manage_messages). Hasta hoy los mensajes salían por ManyChat, que cobra por
   * contacto: cada persona nueva que contesta una historia era un contacto más. Por acá no hay tope.
   *
   * `igId` es el id de la persona en Instagram (dm_contactos.ig_id), no el de ManyChat.
   * Vale la misma regla de las 24 horas: pasado ese rato Instagram no deja y lo dice en el error.
   */
  async function mandar(igId, texto) {
    const cuerpo = JSON.stringify({ recipient: { id: String(igId) }, message: { text: String(texto) } });
    const init = { method: "POST", headers: { "Content-Type": "application/json" }, body: cuerpo };
    if (credencialFb) {
      const c = await conexionFb();
      return llamar(`${GRAPH_FB}/${c.pagina}/messages?access_token=${encodeURIComponent(c.token)}`, ESPERA_MS, init);
    }
    const tk = await token();
    if (!tk) throw new ErrorInstagram("falta INSTAGRAM_TOKEN");
    return llamar(`${API}/me/messages?access_token=${encodeURIComponent(tk)}`, ESPERA_MS, init);
  }

  /**
   * Los textos de una respuesta, en orden y de a uno. Devuelve lo mismo que lib/dm/manychat.js
   * para que quien manda no tenga que saber por dónde salió.
   *
   * Si uno falla después de que otro salió, no se reintenta ninguno: el lead ya recibió parte y
   * repetirlo sería mandarle lo mismo dos veces. Lo dice en `mando` para que quede en el aviso.
   */
  async function mandarTextos(igId, textos) {
    let mando = 0;
    for (const texto of textos) {
      try {
        await mandar(igId, texto);
        mando += 1;
      } catch (e) {
        const error = String(e.message || e).slice(0, 300);
        // Si se cortó por tiempo el pedido pudo haber salido igual: no se puede dar por no enviado.
        if (e?.demora) return { ok: false, incierto: true, error, mando };
        return { ok: false, error, code: e?.code ?? null, mando };
      }
    }
    return { ok: true, mando };
  }

  /**
   * Los posts y reels de la cuenta, los más nuevos primero: { id, timestamp, comments_count,
   * permalink }. Los usa el cron de los comentarios (pages/api/dm/comentarios.js) para saber dónde
   * mirar. `comments_count` cuenta también las respuestas a comentarios, así que puede ser más de
   * lo que después devuelve comentarios(): no sirve para decidir si hay algo nuevo.
   */
  async function medios({ limite = 25 } = {}) {
    const c = credencialFb ? await conexionFb() : null;
    const id = c ? c.igId : (await cuenta()).user_id;
    const r = await get(`/${id}/media`, { fields: "id,timestamp,comments_count,permalink", limit: String(limite) });
    return r.data || [];
  }

  /**
   * Los comentarios de un post o reel, los más nuevos primero: { id, text, timestamp, username }.
   * Lee hasta `paginas` páginas (un reel que funcionó tiene cientos). Solo los de primer nivel: a
   * una respuesta a un comentario Instagram no deja contestarle por privado.
   */
  async function comentarios(medio, { limite = 50, paginas = 10 } = {}) {
    const todos = [];
    let despues = null;
    for (let i = 0; i < paginas; i++) {
      const r = await get(`/${medio}/comments`, {
        fields: "id,text,timestamp,username", limit: String(limite), ...(despues ? { after: despues } : {}),
      });
      todos.push(...(r.data || []));
      despues = r.paging?.next && r.paging?.cursors?.after ? String(r.paging.cursors.after) : null;
      if (!despues) break;
    }
    return todos;
  }

  /**
   * La private reply de un comentario: UN DM a quien comentó, con el id del comentario en lugar del
   * de la persona. Instagram deja uno solo por comentario y hasta 7 días después (ver
   * lib/dm/comentarios.js). Devuelve lo que contesta Instagram, con recipient_id: el id de la
   * persona, que hasta acá no se conocía.
   *
   * Va por la página de Facebook de la cuenta: con el token de la página y los permisos
   * instagram_manage_comments y pages_messaging, que son los que ya tiene el permiso del sitio. Sin
   * ese permiso no hay private replies (el token de graph.instagram.com no las hace).
   */
  async function responderComentario(comentario, texto) {
    if (!credencialFb) throw new ErrorInstagram("las respuestas a comentarios van por la página de Facebook de la cuenta");
    const c = await conexionFb();
    const cuerpo = JSON.stringify({ recipient: { comment_id: String(comentario) }, message: { text: String(texto) } });
    return llamar(`${GRAPH_FB}/${c.pagina}/messages?access_token=${encodeURIComponent(c.token)}`, ESPERA_MS, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: cuerpo,
    });
  }

  return {
    token, cuenta, pagina, hilos, completo, hiloDe, adjuntosDe, perfil, mandar, mandarTextos, renovar, diasQueQuedan, anda,
    medios, comentarios, responderComentario,
  };
}

/**
 * Las reglas sobre una charla del agente: si Cande sigue a la persona o escribió "--", el agente
 * sale. `ig` es el cliente de arriba; `base` y `manychat`, los de siempre; `avisar(titulo, campos)`
 * le escribe a Cande. Nunca tira: si Instagram falla, la respuesta es "no sale" y a Cande le llega
 * un aviso por día como mucho.
 */
export function crearReglasInstagram({ ig = null, base, manychat, avisar, reloj = () => new Date(), registrar = () => {} }) {
  /**
   * El usuario de Instagram del contacto y el id que le da ManyChat. Se le pregunta a ManyChat una
   * sola vez y queda guardado (vacío: no tiene usuario).
   */
  async function datosIg(c) {
    if (c.ig_usuario != null) return { usuario: c.ig_usuario, idManyChat: c.ig_id_mc ?? null };
    const d = await manychat.datosDe(c.id);
    if (!d.ok) throw new Error(`ManyChat no dio el usuario de Instagram: ${d.error}`);
    const usuario = minuscula(d.ig_username);
    const idManyChat = d.ig_id != null && d.ig_id !== "" ? String(d.ig_id) : "";
    await base.guardarIg(c.id, { usuario, igIdMc: idManyChat });
    return { usuario, idManyChat };
  }

  /** El id de Instagram de un contacto de ManyChat, en la app de Cande. Se guarda al encontrarlo. */
  async function resolver(c) {
    if (c.ig_id) return c.ig_id;
    if (!ig) return null;
    const { usuario, idManyChat } = await datosIg(c);
    if (!usuario) return null;
    // El id que da ManyChat puede ser el mismo que ve la app de Cande, o no (son apps distintas):
    // vale solo si el perfil que devuelve Instagram es el mismo usuario.
    if (idManyChat) {
      let p = null;
      try {
        p = await ig.perfil(idManyChat);
      } catch (e) {
        if (e?.code !== 100) throw e; // un corte o el límite de pedidos no dicen que el id no sirva
      }
      if (p?.usuario === usuario) {
        await base.guardarIg(c.id, { igId: idManyChat });
        return idManyChat;
      }
      await base.guardarIg(c.id, { igIdMc: "" });
    }
    // La charla tiene que estar entre las últimas movidas: el lead acaba de escribir, o el agente le
    // escribió. Si no está, el cron la encuentra la próxima vez que se mueva (buscarCodigos).
    for (const h of await ig.hilos({ limite: 20, mensajes: 3 })) {
      const hc = await ig.completo(h, 1);
      if (hc.otro?.usuario === usuario && hc.otro.id) {
        await base.guardarIg(c.id, { igId: hc.otro.id });
        return hc.otro.id;
      }
    }
    return null;
  }

  async function fallo(e) {
    registrar(e);
    // Una demora, el límite de pedidos o un error de Meta se arreglan solos en la vuelta siguiente: no se avisa
    // (17/10: le llegó "Instagram tardó más de 12 segundos"). Se avisa lo que necesita que ella haga algo.
    if (e?.demora || [4, 17, 32, 613, 80002].includes(e?.code) || (e?.status >= 500)) return;
    try {
      const estado = (await base.leerConfig("instagram_estado")) || {};
      const ultimo = estado.avisado ? new Date(estado.avisado) : null;
      if (ultimo && reloj() - ultimo < AVISO_CADA) return;
      await base.guardarConfig("instagram_estado", { avisado: reloj().toISOString(), error: explicarError(e) });
      await avisar("DM: la conexión con Instagram no anda", {
        Motivo: explicarError(e),
        Nota: "mientras tanto el agente sigue igual, pero no ve si seguís a alguien ni tus --",
      });
    } catch {
      // sin base ni Telegram no hay dónde avisar
    }
  }

  /** Las marcas de retomada (dm_config "retomadas", ver marcaDe). Si la base no contesta, tira: quien llama decide. */
  async function retomadas() {
    return base.leerConfig(CLAVE_RETOMADAS);
  }

  /**
   * Si la charla tiene la marca de retomada (tieneMarcaDeRetomada: vigente, aunque ya se haya usado, o usada antes de
   * vencer). El agente (lib/dm/agente.js) hace lo de una charla retomada solo si esto da true: lo pregunta después de la
   * mirada, cuando la marca ya pudo quedar usada. Si la base no contesta, tira: quien llama decide (el agente, como en
   * main).
   */
  async function retomada(c) {
    return tieneMarcaDeRetomada(await retomadas(), c.id, reloj());
  }

  /** Los textos de los automáticos cargados (dm_config "automaticos", ver conLaMarca). Si la base no contesta, tira. */
  const automaticos = automaticosCargados((k) => base.leerConfig(k));

  /**
   * La marca con la que se mira el hilo `h` de la charla de `c` (marcaParaElHilo), o null: se mira como en main. Solo
   * le pregunta a la base si la cuenta escribió algo en la charla desde que es del agente. Si la base no deja leer la
   * marca, null (queda en el registro, sin aviso): como en main.
   */
  async function marcaDelHilo(c, h, yo) {
    if (c?.dueno !== "agente" || !escribioLaCuenta(h, yo, desdeManual(c))) return null;
    let marcas;
    try {
      marcas = await retomadas();
    } catch (e) {
      registrar(e);
      return null;
    }
    const marca = marcaParaElHilo(marcas, c, h, yo, reloj());
    return marca ? { marca, marcas } : null;
  }

  /**
   * La mirada de una charla retomada (marcaDelHilo dio una marca): lo que Cande escribió a mano con la marca queda
   * anotado y la respuesta es null; lo que no cubre la marca la saca ("le escribiste vos"). Si la base no deja leer lo
   * que hace falta o anotar lo suyo, NO_AHORA: ni contestar encima de ella ni sacarla de una charla que quiere que siga
   * (queda en el registro, sin el aviso de la conexión de Instagram: no es Instagram).
   */
  async function mirarRetomada(c, h, yo, { marcas }) {
    const desde = desdeManual(c);
    let manuales;
    try {
      const conocidos = await base.textosDeLaCuenta(c.id);
      const conMarca = await conLaMarca(h, yo, c, marcas, base.textosDeLaCuenta, automaticos);
      manuales = manualesEnHilo(h, yo, conocidos, desde, conMarca);
    } catch (e) {
      registrar(e);
      return NO_AHORA;
    }
    if (!manuales.length) return null;
    if (!seAnotaComoRetomada(c, manuales, marcas)) return "le escribiste vos";
    try {
      await anotarRetomada(c, manuales);
    } catch (e) {
      registrar(e);
      return NO_AHORA; // sin lo suyo anotado, el agente le contestaría encima (y un toque saldría detrás de ella)
    }
    return null;
  }

  /**
   * En una charla retomada, lo que Cande escribió a mano (`manuales`, de manualesEnHilo) queda anotado como suyo y lo
   * que el lead había escrito hasta su último mensaje, contestado. La charla sigue del agente. Devuelve cuántos anotó.
   */
  async function anotarRetomada(c, manuales) {
    return base.anotarCandeDesdeIg(c.id, manuales.map(paraAnotarDeCande));
  }

  /**
   * Por qué el agente tiene que salir de esta charla, o null.
   *   lista: la persona está en la lista de cuentas que sigue Cande (la que ella bajó de Instagram,
   *          base.loSigue). No necesita el token: el usuario sale de ManyChat.
   *   api:   lo que dice Instagram en el momento (el "--" en la charla y si la sigue). Necesita el token.
   * Los "--" de antes de que la charla volviera al agente no cuentan; en un alta sin confirmar, cualquiera.
   * Si Cande se la dio al agente a propósito, que la siga no la saca (su "--" sí).
   * En una charla del agente retomada, lo que ella escribió a mano con la marca (seAnotaComoRetomada) no la saca: queda
   * anotado (anotarRetomada, que deja la marca usada) y la respuesta es null. El agente vuelve a leer qué quedó
   * contestado (lib/dm/agente.js). En una charla que ya es de Cande, lo que escribió la deja de ella aunque tenga la
   * marca: no hay nada que anotar (se mira como en main), y el rescate de una respuesta vencida no la manda detrás de
   * ella. En una charla retomada, si la base no deja leer lo que hace falta o anotar lo suyo, la respuesta es NO_AHORA:
   * ni contestar encima de ella ni sacarla de una charla que quiere que siga. NO_AHORA sale solo de una charla con la
   * marca: sin la marca, o sin poder leerla, todo es como en main (marcaDelHilo).
   * `lectura`: si viene, queda ahí el hilo que se leyó ({ hilo, cuenta }), para que el agente arme el turno con lo que
   * se habló antes de que la charla entrara a la base (charlaPrevia) sin otro pedido a Instagram. Si no se leyó (sin
   * el token, sin el ajuste, sin su id o si falló), queda como vino.
   */
  async function porQueSale(c, { lista = false, api = true } = {}, lectura = null) {
    if (lista && !c.entregada) {
      try {
        const { usuario } = await datosIg(c);
        if (usuario && (await base.loSigue(usuario))) return "la seguís en Instagram";
      } catch (e) {
        registrar(e); // sin el usuario no se puede comparar: el agente sigue igual
      }
    }
    if (!api || !ig) return null;
    try {
      const igsid = await resolver(c);
      if (!igsid) return null;
      // Las dos lecturas a la vez: esto corre antes de cada respuesta y el lead está esperando. Si
      // una falla, la otra vale igual.
      const yo = await ig.cuenta();
      const [hilo, p] = await Promise.allSettled([ig.hiloDe(igsid), ig.perfil(igsid)]);
      if (hilo.status === "fulfilled" && hilo.value && codigoEnHilo(hilo.value, yo, desdeDe(c))) return "escribiste -- en Instagram";
      const h = hilo.status === "fulfilled" ? hilo.value : null;
      if (h && lectura) Object.assign(lectura, { hilo: h, cuenta: yo });
      // Una charla retomada se mira con su marca (mirarRetomada). Sin la marca, o si la base no deja leerla, como en
      // main: lo escrito a mano la saca y una falla de la base va al aviso de la conexión (fallo, abajo). Por eso, si no
      // se puede leer la marca y lo que pegó Cande pasa por conocido con la comparación de siempre (un "Hola!" viejo en
      // lo sembrado), el agente redacta sin lo suyo (revisión del 21/10, tercera vuelta: queda así a propósito, es lo
      // de main). Si para la mirada de antes de mandar la base ya contesta, esa mirada lo anota y lo redactado no sale
      // (lib/dm/agente.js, el turno se rehace); si la base sigue sin contestar, sale.
      const conMarca = h ? await marcaDelHilo(c, h, yo) : null;
      if (h && !conMarca && manualEnHilo(h, yo, await base.textosDeLaCuenta(c.id), desdeManual(c))) {
        return "le escribiste vos";
      }
      if (conMarca) {
        const r = await mirarRetomada(c, h, yo, conMarca);
        if (r) return r;
      }
      // Si Cande se la dio al agente a propósito, que la siga no la saca (su "--" sí).
      if (p.status === "fulfilled" && p.value.laSigue) {
        // Lo que dice Instagram también suma a la lista: así queda al día sin volver a bajarla.
        try {
          if (p.value.usuario) await base.anotarSeguidos([p.value.usuario]);
        } catch {
          // la lista se completa la próxima vez
        }
        if (!c.entregada) return "la seguís en Instagram";
      }
      const falla = [hilo, p].find((r) => r.status === "rejected");
      if (falla) await fallo(falla.reason);
      return null;
    } catch (e) {
      await fallo(e);
      return null;
    }
  }

  /**
   * Los links de las últimas `cuantas` fotos (o archivos) que mandó la persona desde `desde` (con 2 minutos de
   * margen), en el orden en que las mandó. Para cuando ManyChat entrega la foto sin link. Nunca tira: si
   * Instagram no las da, devuelve lo que encontró (o nada) y la foto va a Cande como siempre. No avisa de la
   * falla: ya la avisa la mirada de cada respuesta.
   */
  async function imagenesDelLead(c, { cuantas = 1, desde = null } = {}) {
    if (!ig?.adjuntosDe || cuantas < 1) return [];
    try {
      const igsid = await resolver(c);
      if (!igsid) return [];
      const piso = desde ? new Date(desde).getTime() - 2 * 60000 : null;
      const urls = (await ig.adjuntosDe(igsid))
        .filter((m) => piso === null || (m.creado && m.creado.getTime() >= piso))
        .reverse()
        .flatMap((m) => m.urls);
      return urls.slice(-cuantas);
    } catch (e) {
      registrar(e);
      return [];
    }
  }

  /**
   * Saca al agente: la charla queda de Cande, sin aviso (ella ya sabe: la sigue o escribió --).
   * Un alta que todavía no se confirmó como lead se borra entera, como una charla personal, pero no queda
   * marcada como personal: es de Cande, y si el lead escribe y nadie le contesta, la red de la bandeja
   * (lib/dm/bandeja.js) se la recuerda en su resumen.
   */
  async function sacar(c, motivo) {
    await base.descartarPendientes(c.id);
    if (c.alta_en && c.alta_avisada === false) {
      await base.borrarCharla(c.id, { personal: false });
    } else {
      await base.ponerDueno(c.id, "cande");
      await base.anotar(c.id, "sistema", `La charla quedó de Cande: ${motivo}`);
    }
    try {
      await manychat.ponerCampo(c.id, "dm_dueno", "cande");
    } catch {
      // el campo es para los automáticos de ManyChat: el agente ya no le escribe
    }
  }

  return {
    resolver, porQueSale, sacar, fallo, imagenesDelLead, retomadas, retomada, anotarRetomada, automaticos, marcaDelHilo, conApi: Boolean(ig),
  };
}

/**
 * Lo que salió igual de la cuenta en dos charlas o más de la lista: es un automático (la bienvenida, el del CV),
 * no Cande escribiendo a mano. Devuelve las claves de esos textos (claveTexto).
 */
export function plantillasDe(lista, cuenta) {
  const veces = new Map();
  for (const h of lista) {
    for (const k of new Set(h.mensajes.filter((m) => esDeLaCuenta(m.de, cuenta) && m.texto).map((m) => claveTexto(m.texto)))) {
      veces.set(k, (veces.get(k) || 0) + 1);
    }
  }
  return [...veces].filter(([k, n]) => n >= 2 && k.length >= 4).map(([k]) => k);
}

/**
 * La vuelta del cron por la bandeja: busca los "--" que escribió Cande en las charlas movidas desde
 * la vuelta anterior y saca al agente de esas charlas, aunque el lead no vuelva a escribir. En una charla
 * retomada, lo que ella escribió a mano con la marca no la saca: queda anotado como suyo (reglas.anotarRetomada), aunque
 * sea el mismo texto que pegó en otras charlas de la vuelta (manualesConPlantillas).
 * Si Instagram falla, la vuelta entera falla y no avanza. Si falla la base en una charla retomada, esa charla queda para
 * la vuelta siguiente (`hasta` no la pasa) y se sigue con las demás, sin el aviso de la conexión de Instagram: no es
 * Instagram (revisión del 21/10). En una charla sin la marca (o si la base no deja leerla) es como en main: la vuelta
 * entera falla y el cron avisa (pages/api/dm/instagram.js, fallo). `registrar` anota la falla.
 * La charla se encuentra por el id de Instagram de la persona o, si todavía no se sabe, por su usuario
 * (base.contactoDeIg): una charla sembrada con su id (/api/dm/config, sembrar con ig_id) se mira desde la primera
 * vuelta, aunque todavía no tenga el usuario.
 * Devuelve cuántas charlas miró, de cuántas sacó al agente, en cuántas anotó a Cande (anotadas), en cuántas falló la
 * base (fallidas) y hasta dónde miró.
 */
export async function buscarCodigos({ ig, base, reglas, desde, limite = 50, registrar = () => {} }) {
  // base: contactoDeIg, guardarIg, tomar y soltar (la traba: si el agente está contestando esa charla,
  // no se la toca acá; su propia mirada antes de mandar ve el "--").
  const yo = await ig.cuenta();
  let miradas = 0;
  let sacadas = 0;
  let anotadas = 0;
  let fallidas = 0;
  let hasta = desde;
  let retener = null; // la charla retomada más vieja en que falló la base: la vuelta siguiente la vuelve a mirar
  const lista = await ig.hilos({ limite });
  const plantillas = plantillasDe(lista, yo);

  /** Saca al agente de la charla, con la traba. "sacada", o null si la está contestando otra corrida. */
  async function sacarDe(c, motivo) {
    const marca = randomUUID();
    const tomado = await base.tomar(c.id, marca);
    if (!tomado) return null;
    try {
      await reglas.sacar(tomado, motivo);
      return "sacada";
    } finally {
      await base.soltar(c.id, marca);
    }
  }

  /**
   * Una charla de la vuelta: "sacada", "anotada" o null. Lo que tira acá es de la base. `estado.retomada` queda en true
   * si la charla se mira con la marca de retomada: solo ahí una falla de la base no corta la vuelta.
   */
  async function mirar(h, estado) {
    const c = await base.contactoDeIg({ igId: h.otro.id, usuario: h.otro.usuario });
    if (!c) return null;
    if (c.ig_id && h.otro.id && c.ig_id !== h.otro.id) return null; // es otra persona con ese usuario
    if (!c.ig_id && h.otro.id) await base.guardarIg(c.id, { igId: h.otro.id });
    if (c.dueno !== "agente") return null;
    const codigo = codigoEnHilo(h, yo, desdeDe(c));
    // Su "--" la saca siempre. Sin la marca de retomada (o si la base no deja leerla), como en main.
    const conMarca = !codigo && reglas.marcaDelHilo ? await reglas.marcaDelHilo(c, h, yo) : null;
    if (!conMarca) {
      const aMano = !codigo && manualEnHilo(h, yo, [...(await base.textosDeLaCuenta(c.id)), ...plantillas], desdeManual(c));
      if (!codigo && !aMano) return null;
      return sacarDe(c, codigo ? "escribiste -- en Instagram" : "le escribiste vos");
    }
    // Charla retomada: lo que escribió a mano con la marca se anota; lo que la marca no cubre la saca.
    estado.retomada = true;
    const conocidos = await base.textosDeLaCuenta(c.id);
    const conLaSuya = await conLaMarca(h, yo, c, conMarca.marcas, base.textosDeLaCuenta, reglas.automaticos);
    const aMano = manualesConPlantillas(h, yo, c, { conocidos, plantillas, retomadas: conMarca.marcas, conMarca: conLaSuya });
    if (!aMano.length) return null;
    if (!seAnotaComoRetomada(c, aMano, conMarca.marcas)) return sacarDe(c, "le escribiste vos");
    const marca = randomUUID();
    const tomado = await base.tomar(c.id, marca);
    if (!tomado) return null;
    try {
      return (await reglas.anotarRetomada(tomado, aMano)) ? "anotada" : null;
    } finally {
      await base.soltar(c.id, marca);
    }
  }

  for (const h0 of lista) {
    if (desde && h0.actualizado && h0.actualizado <= desde) break; // vienen de la más nueva a la más vieja
    miradas++;
    if (h0.actualizado && (!hasta || h0.actualizado > hasta)) hasta = h0.actualizado;
    const h = await ig.completo(h0);
    if (!h.otro) continue;
    const estado = { retomada: false };
    let r;
    try {
      r = await mirar(h, estado);
    } catch (e) {
      if (e instanceof ErrorInstagram || !estado.retomada) throw e;
      registrar(e);
      fallidas++;
      if (h0.actualizado && (!retener || h0.actualizado < retener)) retener = h0.actualizado;
      continue;
    }
    if (r === "sacada") sacadas++;
    if (r === "anotada") anotadas++;
  }
  // Para que la vuelta siguiente vuelva a mirar la charla en que falló la base, lo mirado queda justo antes de ella.
  if (retener && hasta && hasta >= retener) hasta = new Date(retener.getTime() - 1);
  return { miradas, sacadas, anotadas, fallidas, hasta };
}
