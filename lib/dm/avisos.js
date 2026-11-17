// Qué le suena a Cande en Telegram y qué espera el resumen.
//
// 17/11, Cande: "el chat de mensajes debería ser únicamente para gente que tiene empresas y que puede llegar a ser mi
// clienta", "me estás mandando cosas muy raras que no sabes cómo contestar y me estás mandando cualquier pelotudez",
// "este chat se llena y al final no leo nada porque tengo 8.000 mensajes innecesarios".
//
// La regla, en una línea: un aviso suelto sale solo si la persona puede llegar a ser clienta. Lo que el agente no supo
// contestar dejó de ser motivo por sí solo: la charla pasa a Cande igual (nadie queda sin dueño), pero el aviso va al
// resumen de las notas (lib/dm/resumen.js), que sale dos veces por día, junto y sin sonido. Lo que no puede esperar
// sigue saliendo al momento, sea de quien sea: plata que ya se movió, un comprobante, una crisis, un pedido de baja y
// quien dice que contrata (esInevitable).
//
// Quién puede ser clienta, con lo que la base ya sabe de la charla:
//   - quien contrata o construye algo y contrata (el estado del modelo, o las señales de empresa de lib/dm/frenos.js);
//   - quien ya movió plata o espera un acceso (es clienta, no "puede ser");
//   - quien ya recibió una oferta de la cuenta (el programa de 27 o el 1 a 1): el agente ya la trató como lead;
//   - un dev (o quien estudia) que el modelo dice que busca o está abierto a escuchar;
//   - un dev que llenó el formulario de la red y es semi senior o más (16/11: el target son los bien posicionados que
//     quieren mejorar su posición, que es a quienes les vende el 1 a 1, lo que más deja).
// Lo demás no: un saludo suelto, una reacción, quien no es dev, y quien todavía no dio ninguna señal.
import { FRENOS_DE_CANDE, esDev, esEmpresa, senalDeEmpresa, senales } from "./frenos";
import { esParaCande, esUrgente } from "./resumen";

/**
 * La constancia de un aviso que no sonó: una fila de dm_salidas con esta acción y este estado, con la nota que sale en
 * el resumen (base.notasParaResumen la trae, y lib/dm/resumen.js la deja pasar siempre: lo callado no se filtra otra
 * vez, o quedaría callado del todo).
 */
export const ACCION_AVISO = "aviso";
export const ESTADO_CALLADO = "callado";

/**
 * De dónde sale el aviso. "lead": lo que la persona hizo o dijo (el modelo pide pasarle la charla, mandó una foto,
 * quiere el 1 a 1). "agente": el agente no supo seguir (un freno, un error al mandar, el tope del día, una falla, una
 * solicitud de Instagram sin aceptar). Lo del agente no suena por sí solo, 17/11: "me estás mandando cosas muy raras
 * que no sabes cómo contestar". Queda anotado y sale en el resumen, salvo que sea inevitable (plata, crisis, baja,
 * empresa).
 */
export const POR_EL_LEAD = "lead";
export const POR_EL_AGENTE = "agente";

/** Lo que dice el modelo de quien busca trabajo o está abierto a escuchar (dm_contactos.estado.busca). */
const BUSCA = new Set(["si", "abierto"]);

/**
 * El seniority del formulario de la red (red_devs.seniority) que es el target desde el 16/11: semi senior o más. Un
 * junior entra por la otra puerta (el modelo dice que es dev y que busca), no por esta.
 */
const BIEN_POSICIONADO = new Set(["semi-senior", "semi senior", "semisenior", "senior", "lead", "architect", "staff", "principal"]);

/** Si lo que llenó en el formulario de la red dice que está bien posicionada (base.perfilDeLaRed). */
export const esBienPosicionado = (perfil) =>
  BIEN_POSICIONADO.has(String(perfil?.seniority || "").trim().toLowerCase());

/**
 * Si por lo que se sabe de esta charla la persona puede llegar a ser clienta de Cande.
 * `estado` es el estado del contacto (lo último que dijo el modelo: quien, busca), `charlaDelLead` los textos del lead,
 * `perfil` lo que llenó en el formulario de la red y `oferta` si la cuenta ya le ofreció el programa o el 1 a 1.
 */
export function puedeSerCliente({ estado = null, charlaDelLead = [], perfil = null, oferta = false } = {}) {
  const quien = estado?.quien ?? null;
  const busca = estado?.busca ?? null;
  const lead = senales(charlaDelLead);
  // Quien contrata: lo que Cande pidió que le llegue siempre.
  if (esEmpresa(quien) || lead.contrataDevs) return true;
  if (senalDeEmpresa(charlaDelLead, { quien, busca, previo: estado })) return true;
  // Plata que ya se movió o un acceso que no llega: ya es clienta.
  if (lead.pagos) return true;
  // La cuenta ya le ofreció algo: el agente la trató como lead y la venta está abierta.
  if (oferta) return true;
  if (!esDev(quien)) return false;
  return BUSCA.has(busca) || esBienPosicionado(perfil);
}

/**
 * Lo que sale al momento aunque la persona no pueda ser clienta (punto 3 del pedido del 17/11): plata que ya se movió o
 * un comprobante, una crisis, un pedido de baja, un freno de los que cuidan lo que es de ella (frenos.FRENOS_DE_CANDE)
 * y quien dice que contrata. También lo que ella misma pidió que le suene (resumen.esParaCande: una empresa, quien
 * pregunta si le contesta un bot, quien quiere el 1 a 1).
 * `avisos` son los textos del aviso (lo que dice y lo que anotó el modelo) y `dijo`, lo último que dijo el lead.
 */
export function esInevitable({ estado = null, charlaDelLead = [], motivo = "", avisos = [], dijo = "" } = {}) {
  const lead = senales(charlaDelLead);
  if (lead.pagos || lead.crisis || lead.baja) return true;
  if (FRENOS_DE_CANDE.has(String(motivo || ""))) return true;
  if (esEmpresa(estado?.quien) || lead.contrataDevs) return true;
  // Cada aviso por separado: lo que ella pidió que le suene se mira desde el principio del aviso ("YA: quiere el 1 a 1"),
  // así que juntarlos en un texto lo escondería. Sin avisos, queda lo que dijo el lead (un bot, una IA).
  const textos = avisos.length ? avisos : [""];
  return textos.some((a) => esParaCande({ quien: estado?.quien, aviso: a, dijo }));
}

/** Por qué este aviso no suena, dicho para el resumen. */
function porQueNoSuena({ estado = null, charlaDelLead = [], perfil = null } = {}) {
  const quien = estado?.quien ?? null;
  if (quien === "no_dev") return "no es dev y no dijo que contrate";
  if (!charlaDelLead.filter((t) => String(t || "").trim()).length) return "no escribió nada todavía";
  if (!esDev(quien)) return "todavía no se sabe quién es";
  if (esBienPosicionado(perfil)) return "es dev bien posicionada pero no dijo que busque";
  return "es dev y no dijo que busque ni que contrate";
}

/**
 * Si este aviso le suena a Cande ahora: { sale, porque }. `porque` es por qué no suena (vacío si sale), y es lo que
 * lleva la nota del resumen. Son dos preguntas, y las dos tienen que dar que sí: que el aviso valga por sí mismo (lo
 * que el agente no supo seguir, no) y que la persona pueda llegar a ser clienta. Lo inevitable se saltea las dos.
 * Con `siempre` sale sin mirar nada: los avisos que no son de una persona (el tope de altas) y los de plata (el
 * comprobante, el borrador del código).
 */
export function avisoAlMomento({ siempre = false, origen = POR_EL_LEAD, repetido = false, ...datos } = {}) {
  if (siempre) return { sale: true, porque: "" };
  // El mismo aviso de la misma charla otra vez no suena, ni siendo urgente: ella ya lo leyó y lo que tiene que hacer es
  // lo mismo. Va antes de lo inevitable a propósito; los avisos de plata no pasan por acá (van con `siempre`).
  if (repetido) return { sale: false, porque: "ya te pasé este mismo aviso de esta charla hace un rato" };
  if (esInevitable(datos)) return { sale: true, porque: "" };
  if (origen === POR_EL_AGENTE) {
    // "No es motivo por sí solo": suena si además el aviso dice que no puede esperar (HOY: o YA:, lo que deja al lead
    // esperando) y la persona puede llegar a ser clienta. Con una de las dos cosas sola, no.
    const puede = puedeSerCliente(datos);
    if (puede && (datos.avisos || []).some(esUrgente)) return { sale: true, porque: "" };
    return {
      sale: false,
      porque: `no supe seguir la charla y no hay nada urgente${puede ? " (es una posible clienta: miralá cuando puedas)" : ""}`,
    };
  }
  if (puedeSerCliente(datos)) return { sale: true, porque: "" };
  return { sale: false, porque: porQueNoSuena(datos) };
}

/**
 * La clave de un aviso para no mandar dos veces el mismo de la misma charla (base.avisosDeLaCharla y agente.yaAvisado):
 * el principio de lo que dice, sin tildes, mayúsculas ni signos. Así "quiere el 1 a 1, le pasé tu agenda" y "quiere el
 * 1 a 1, le pasé tu agenda de nuevo" son el mismo aviso, y uno que dice otra cosa sale igual. HORAS_REPETIDO es medio
 * día: lo que ella tiene que hacer con el mismo aviso otra vez es lo mismo que ya leyó.
 */
export const HORAS_REPETIDO = 12;
export function claveDeAviso(texto) {
  const t = String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/^\s*(hoy|ya|nota)\s*:\s*/, "").replace(/[^a-z0-9]+/g, " ").trim();
  return t ? t.slice(0, 30) : null;
}

// El largo de la nota: la del resumen entra entera hasta 600 (resumen.TOPE_NOTA).
const TOPE_NOTA = 560;
const corto = (s, n) => (Array.from(String(s ?? "")).length > n ? `${Array.from(String(s)).slice(0, n).join("")}…` : String(s ?? ""));

/**
 * La nota que queda guardada cuando un aviso no suena, para que salga en el resumen de las notas: arranca con "NOTA:"
 * (así no suena nunca, resumen.esUrgente) y dice qué pasaba y por qué no se lo pasé al momento. De los campos del aviso
 * toma todo lo que cuenta algo (lo que decía, el motivo, lo que no se pudo hacer, lo último que dijo la persona), nunca
 * el link ni el nombre: el resumen ya los pone.
 */
export function notaDeLoCallado(titulo, campos = {}, porque = "") {
  const dice = ["Aviso", "Aviso del agente", "Motivo", "Ojo", "Lo último que dijo", "Lo último que escribió", "Dijo"]
    .map((k) => String(campos?.[k] ?? "").trim())
    .filter(Boolean);
  const limpio = String(titulo || "").replace(/^DM( URGENTE)?:\s*/i, "").trim();
  return corto(`NOTA: no te lo pasé al momento (${porque || "no parecía una posible clienta"}): ${[limpio, ...dice].filter(Boolean).join(" · ")}`, TOPE_NOTA);
}
