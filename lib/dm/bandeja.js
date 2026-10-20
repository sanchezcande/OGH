// La red de la bandeja (20/10). Cande: "ya al menos 10 veces te dije que no queden charlas sin contestar".
//
// Por qué quedaban: al agente le llega solo lo que manda el webhook de ManyChat (pages/api/dm/entrada.js). Si
// ManyChat no lo manda, nadie se entera. En la bandeja real, de 150 charlas desde el 18/10, en 36 lo último lo
// había escrito el lead: 8 personas nuevas que nunca entraron a la base, 4 mensajes de charlas del agente que no
// llegaron, 16 charlas pasadas a Cande que ella no llegó a contestar, y lo que pasó las 24 horas sin respuesta.
//
// Qué hace: mira la bandeja de verdad (no la base) cada 3 minutos (pages/api/dm/bandeja.js). Lee de a páginas de
// 50 las charlas movidas desde la vuelta anterior y, cada media hora, todas las de las últimas 25 horas (la
// primera vez, las de la última semana). Si se corta por tiempo, la vuelta siguiente sigue desde donde quedó
// (dm_config "bandeja_paginas"): una charla que bajó del puesto 50 no se pierde. De cada charla con lo último
// escrito por el lead, sin respuesta:
//   - Alguien que el agente no conoce: se lo busca en ManyChat y, si ManyChat confirma que es esa cuenta de
//     Instagram, entra como un alta (con su propio tope por día) con sus mensajes y la etiqueta agente_dm (sin ella
//     ManyChat no le pasa al agente lo que escriba después). Lo contesta la espera.
//   - Una charla del agente con mensajes del lead que no están en la base: se guardan con la hora en que los
//     escribió y el turno queda abierto. Lo contesta la espera (pages/api/dm/espera.js). Un automático cargado de
//     ManyChat que salió después (una palabra clave que se tragó el mensaje) no cuenta como respuesta. Lo que salió
//     de la cuenta se reconoce con lo que la base sabe que mandaron el agente o Cande en esa charla
//     (enviadosEnLaCharla): eso es una respuesta que llegó. Que un texto se repita en otras charlas no lo hace
//     automático: el agente escribe con su voz y repite frases.
//   - Una charla del agente con todo guardado, la respuesta enviada hace rato y en Instagram sin respuesta: no le
//     llegó. Va al resumen.
//   - Una charla de Cande (pasada por el agente, reservada, o un alta que se sacó porque ella escribió): no se
//     toca. Va al resumen.
//   - Lo que esperó más de 23 horas: el agente ya no llega (la espera toma hasta 23 horas). Va al resumen.
// Lo más nuevo (3 minutos) se deja: puede estar entrando por el webhook, y el agente contestando.
//
// Lo que espera a Cande queda anotado entre vueltas (dm_config "bandeja_estado") hasta que la bandeja muestra una
// respuesta: una charla movida siempre vuelve arriba, así que lo que no se movió sigue esperando.
//
// No se toca, como en el resto del agente: a quien sigue Cande (en Instagram o en su lista, dm_seguidos), una
// charla donde ella escribió "--" o le escribió a mano (esas van al resumen, no se callan; salvo una charla retomada,
// donde lo que escribió a mano queda anotado como suyo y sigue el agente: lib/dm/instagram.js), ni una charla personal
// (dm_contactos.personal: el agente la borró porque no era un lead, o la borró Cande). A alguien que el agente
// nunca tuvo, cualquier cosa que haya salido de la cuenta y no sea un automático cargado (dm_config
// "automaticos") lo hace de Cande: un audio, una foto, un "Sí", un emoji. Que un texto se repita en otras charlas no
// prueba que sea automático (el agente escribe con su voz y ella repite saludos). A quien se le pasó a Cande en un
// resumen como nueva tampoco se la da de alta después: ya se le dijo que la conteste ella. Si no se pudo ver su
// perfil (no se sabe si Cande la sigue), no hay alta en esa vuelta. Con el agente apagado o las altas apagadas no
// entra nadie nuevo (va al resumen). Los mensajes perdidos de una charla del agente se guardan igual, como haría la
// entrada: con el agente apagado, el cron de los toques se la pasa a Cande. A una charla personal o borrada
// (borrarCharla la deja de Cande y sin su Instagram) la red no le vuelve a poner su Instagram: solo a las del agente.
//
// Lo que queda para después por los topes de la vuelta (búsquedas en ManyChat, perfiles, tiempo) se lee de nuevo en
// la vuelta siguiente, aunque esté más abajo de lo que repasa la red (las últimas 25 horas): no se pierde.
//
// Nunca dos respuestas al mismo mensaje: cada mensaje guardado por acá lleva su id de Instagram (ig_mid, único
// en la base); lo que ya entró por la entrada se reconoce por texto y hora; si el webhook llega después, la
// entrada no lo guarda otra vez (recibir en lib/dm/agente.js: un texto hasta 24 horas después, un adjunto si
// llega hasta 15 minutos después de que lo mandó, y por su id si el webhook lo trae); y en una charla del agente
// se escribe con su traba (tomar y soltar): si alguien la está contestando, queda para la vuelta siguiente. La
// espera tiene las suyas (reclamarEspera, quizas_salio).
//
// Cómo se le contesta a alguien nuevo (la decisión, 20/10): por ManyChat, como a todos. En la base cada contacto
// es su id de ManyChat: con ese id el agente manda (sendContent) y pausa los automáticos de esa persona (el campo
// dm_dueno). A quien nunca llegó por la entrada se lo busca en ManyChat por nombre (el de su perfil de Instagram,
// y su usuario), y vale solo si ManyChat dice que es la misma cuenta de Instagram (el mismo usuario, o el mismo
// id). La Send API de Instagram con el token de la página NO se usa: con acceso estándar Meta solo deja escribirle
// a quien tiene un rol en la app (para escribirle a cualquier lead hace falta el acceso avanzado, con revisión de
// la app y la empresa verificada, lo mismo que hoy frena los webhooks propios), y sería un segundo remitente al
// lado de ManyChat que no pasa por su pausa ni queda en su bandeja. Si ManyChat no confirma quién es, nadie le
// contesta solo: va al resumen con su link, para Cande.
//
// El resumen: UN aviso de Telegram cada 3 horas como mucho, y solo si trae algo que no estaba en el anterior.
// "Pasadas a vos": lo que espera a Cande hace más de 20 minutos y todavía se puede contestar (primero lo que no
// salió en ningún resumen). "Más de 23 h, solo a mano": cada una sale una sola vez, la más nueva primero. Entra en
// un mensaje de Telegram: si no, van menos renglones, y lo que no se mostró queda para el siguiente. Sin nada, no
// sale nada. Si la red no logra una vuelta entera en media hora, se avisa una vez (vigilarRed).
//
// Todo entra por parámetro para probarlo sin red ni base (tests/dmBandeja.test.mjs).
import { randomUUID } from "node:crypto";
import { SIN_TEXTO, esFoto, mismoMensaje } from "./agente";
import {
  CLAVE_RETOMADAS, automaticosCargados, claveTexto, codigoEnHilo, conLaMarca, desdeDe, desdeManual, escribioLaCuenta, esAutomatico, esConocida,
  esDeLaCuenta, explicarError, linkCharlaIg, manualEnHilo, manualesConPlantillas, marcaParaElHilo, paraAnotarDeCande, plantillasDe,
  seAnotaComoRetomada, usuarioIg,
} from "./instagram";

const MIN = 60000;
const HORA = 60 * MIN;
const DIA = 24 * HORA;

export const CHARLAS_POR_PAGINA = 50;
const MENSAJES_POR_CHARLA = 10;
/** Tope de páginas por vuelta (500 charlas): más de un día de bandeja. */
export const PAGINAS_POR_VUELTA = 10;
/** Lo más nuevo se deja: puede estar entrando por el webhook de ManyChat, y el agente contestando. */
export const GRACIA_MS = 3 * MIN;
/** Hasta acá el agente llega: la espera (base.sinContestar) toma lo de las últimas 23 horas. */
export const VENTANA_AGENTE_MS = 23 * HORA;
/** Lo más viejo que se mira (como base.sinVentana): la primera vez se lee hasta acá. */
export const MIRAR_HASTA_MS = 7 * DIA;
/** Cada media hora se repasan todas las charlas movidas en las últimas 25 horas, no solo las de la última vuelta. */
export const REPASO_HASTA_MS = 25 * HORA;
export const REPASO_CADA_MS = 30 * MIN;
/**
 * Lo que el próximo repaso vuelve a leer seguro (con margen: llega a la media hora o un poco después). Una charla
 * que quedó para después por los topes y es más vieja que esto no la vuelve a leer nadie: se anota hasta dónde leer.
 */
const RELEE_EL_REPASO_MS = REPASO_HASTA_MS - 2 * REPASO_CADA_MS;
/** Las charlas movidas desde la vuelta anterior, con este margen para atrás. */
const SOLAPE_MS = 10 * MIN;
/** Una página nueva se pide solo con este margen antes de `hasta`: Meta puede tardar 25 segundos. */
const MARGEN_PAGINA_MS = 25000;
export const RESUMEN_CADA_MS = 3 * HORA;
/** Una charla para Cande entra al resumen si esperó por lo menos esto (recién le pudo llegar el aviso de la charla). */
export const RECORDAR_DESDE_MS = 20 * MIN;
/** Una respuesta del agente que figura enviada y a los 15 minutos no aparece en Instagram no llegó. */
export const SIN_LLEGAR_MS = 15 * MIN;
/** Lo que se sabe de cada persona (su perfil, quién es en ManyChat) se vuelve a pedir pasado esto. */
const REBUSCAR_NO_HALLADA_MS = 30 * MIN;
const REBUSCAR_HALLADA_MS = 2 * HORA;
/** Búsquedas en ManyChat y perfiles por vuelta: cada una puede tardar varios pedidos. Las que no entran, a la siguiente. */
export const BUSQUEDAS_POR_VUELTA = 6;
export const PERFILES_POR_VUELTA = 15;
const CANDIDATOS_POR_NOMBRE = 5;
/** Lo que ya salió en un resumen se recuerda 8 días (lo más viejo que se mira son 7). */
const OLVIDAR_AVISADAS_MS = 8 * DIA;
/** A quien se le pasó a Cande como nueva no se la da de alta en este tiempo: la tiene ella. */
const RECORDAR_A_CANDE_MS = 30 * DIA;
/** Renglones por sección, como mucho. */
const POR_SECCION = 10;
/** Telegram corta a los 4.096 caracteres: el resumen se arma con menos renglones hasta entrar en esto. */
export const LARGO_AVISO = 3800;
/** Diferencia de relojes entre Instagram y la base que se tolera al comparar horas. */
const DESFASE_MS = 15000;
/** La etiqueta que deja pasar los mensajes de alguien al agente (la misma que pone /agente, lib/dm/respuestas.js). */
export const ETIQUETA_AGENTE = "agente_dm";
/** Las etiquetas que no se pudieron poner se reintentan de a pocas; a la media hora van al resumen; a la semana, se dejan. */
const ETIQUETAS_POR_VUELTA = 3;
const ETIQUETA_AVISO_MS = 30 * MIN;
const ETIQUETA_OLVIDAR_MS = 7 * DIA;
/** Sin una vuelta entera en media hora, se avisa (una vez por caída). */
export const RED_CAIDA_MS = 30 * MIN;

export const TITULO_RESUMEN = "DM: charlas que esperan respuesta tuya";
export const SECCION_VOS = "Pasadas a vos";
export const SECCION_MANO = "Más de 23 h, solo a mano";
export const SECCION_ETIQUETA = "Sin la etiqueta agente_dm";
const NO_HALLADA = "no la encontré en ManyChat";

/** El texto de un mensaje de la bandeja como lo guardaría la entrada: sin texto (una foto, un audio), SIN_TEXTO. */
export const textoDe = (m) => String(m?.texto ?? "").trim().slice(0, 4000) || SIN_TEXTO;

const hora = (d) => new Date(d).getTime();
const fecha = (d) => {
  if (!d) return null;
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? null : t;
};

/**
 * Los mensajes del lead que no tienen respuesta: los del final de la charla, posteriores al mensaje más nuevo de la
 * cuenta, en el orden en que los escribió. Vacío si lo último es de la cuenta. Un mensaje sin autor (no se pudo
 * leer) corta: no se sabe de quién es. `esAuto(m)`: los mensajes de la cuenta que son automáticos de ManyChat no
 * cuentan como respuesta (se saltean).
 */
export function sinRespuesta(h, cuenta, esAuto = null) {
  const lista = [];
  for (const m of h?.mensajes || []) { // Instagram los da de los más nuevos a los más viejos
    if (!m.de) break;
    if (esDeLaCuenta(m.de, cuenta)) {
      if (esAuto?.(m)) continue;
      break;
    }
    lista.push(m);
  }
  return lista.reverse();
}

/** La hora del mensaje más nuevo de la cuenta en la charla (sin contar los automáticos, con `esAuto`), o null. */
export function ultimaDeLaCuenta(h, cuenta, esAuto = null) {
  const m = (h?.mensajes || []).find((x) => esDeLaCuenta(x.de, cuenta) && !esAuto?.(x));
  return m?.creado || null;
}

/** Si lo guardado y lo de la bandeja son el mismo mensaje por su texto (una foto es una foto, con o sin link). */
export const mismoTexto = (guardado, m) => mismoMensaje(guardado, textoDe(m));

/**
 * Los mensajes del lead sin respuesta (`pendientes`, de sinRespuesta) que no están en la base (`guardados`, de
 * base.leadsGuardados): los de después del último que sí está. Uno guardado por la red se reconoce por su id de
 * Instagram; uno que entró por la entrada, por el texto (la entrada lo guarda segundos después, o hasta media hora
 * si ManyChat reintentó) y, si ManyChat mandó el texto un poco distinto, por la hora (3 minutos). Solo cuenta lo
 * guardado después de lo último de la cuenta (`desde`): lo de antes ya tuvo su respuesta.
 */
export function faltantes(pendientes, guardados, desde = null) {
  const piso = desde ? hora(desde) - DESFASE_MS : -Infinity;
  const libres = guardados.filter((g) => !g.ig_mid && g.creado && hora(g.creado) >= piso);
  const usados = new Set();
  const esta = pendientes.map((m) => guardados.some((g) => g.ig_mid && g.ig_mid === m.id));
  const emparejar = (vale) => pendientes.forEach((m, i) => {
    if (esta[i]) return;
    const g = libres.find((x) => !usados.has(x.id) && vale(x, m, hora(x.creado) - hora(m.creado)));
    if (g) {
      usados.add(g.id);
      esta[i] = true;
    }
  });
  emparejar((x, m, dif) => dif >= -DESFASE_MS && dif <= 30 * MIN && mismoTexto(x.texto, m));
  emparejar((x, m, dif) => dif >= -DESFASE_MS && dif <= 3 * MIN);
  return pendientes.slice(esta.lastIndexOf(true) + 1);
}

/** Un mensaje de la bandeja, como lo guarda la base (anotarDesdeBandeja, darDeAltaDesdeBandeja). */
const paraGuardar = (m) => ({ texto: textoDe(m), creado: new Date(m.creado).toISOString(), mid: String(m.id) });

// esConocida (un texto de la cuenta igual a uno conocido, o con 30 letras iguales al principio o al final) y esAutomatico
// (uno de los automáticos cargados) viven en lib/dm/instagram.js: también los usa la marca de retomada. Siguen
// exportándose desde acá.
export { esAutomatico, esConocida };

/**
 * Si en la charla de alguien que el agente nunca tuvo salió de la cuenta algo que no es un automático cargado
 * (`automaticos`, de dm_config "automaticos"): un texto, un audio o una foto (sin texto), un "Sí", un emoji, un
 * "--". Todo eso es Cande. Que un texto se repita en otras charlas no prueba que sea automático: el agente escribe
 * con su voz y ella repite saludos. Lo dudoso cuenta como de ella: el agente no se mete.
 */
export function aManoSinContacto(h, cuenta, automaticos) {
  return (h?.mensajes || []).some((m) => esDeLaCuenta(m.de, cuenta) && !(m.texto && esAutomatico(m.texto, automaticos)));
}

/**
 * Quién es en ManyChat la persona de una charla de Instagram: { id, nombre } si ManyChat confirma una sola, o
 * { id: null, falla, varios }. Se busca por nombre (ManyChat no busca por usuario) y vale solo el contacto cuyo
 * usuario de Instagram es el de la charla (o cuyo id de Instagram es el de la charla). `hasta`: pasada esa hora no
 * se pide nada más (y cuenta como falla: se vuelve a buscar en la vuelta siguiente).
 */
export async function identificar(manychat, { igsid, usuario, nombres, hasta = Infinity, ahora = () => Date.now() }) {
  const u = usuarioIg(usuario);
  const hallados = new Map();
  let falla = false;
  const tiempo = () => {
    if (ahora() < hasta) return true;
    falla = true;
    return false;
  };
  for (const n of [...new Set(nombres.map((x) => String(x || "").trim()).filter(Boolean))]) {
    if (!tiempo()) break;
    const r = await manychat.buscarPorNombre(n);
    if (!r.ok) {
      falla = true;
      continue;
    }
    for (const s of r.contactos.slice(0, CANDIDATOS_POR_NOMBRE)) {
      let iu = s.ig_username;
      let ii = s.ig_id;
      if (iu == null) {
        if (!tiempo()) break;
        const d = await manychat.datosDe(s.id);
        if (!d.ok) {
          falla = true;
          continue;
        }
        iu = d.ig_username;
        ii = d.ig_id;
      }
      if ((u && usuarioIg(iu) === u) || (ii != null && ii !== "" && String(ii) === String(igsid))) hallados.set(String(s.id), s.nombre || null);
    }
    if (hallados.size) break;
  }
  if (hallados.size === 1) {
    const [[id, nombre]] = [...hallados];
    return { id, nombre };
  }
  return { id: null, falla: falla && !hallados.size, varios: hallados.size > 1 };
}

const corto = (s, n = 60) => {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
};

/** Hace cuánto, para el resumen: minutos, horas o días. */
export function haceCuanto(ms) {
  if (ms < HORA) return `${Math.max(1, Math.round(ms / MIN))} min`;
  if (ms < 2 * DIA) return `${Math.round(ms / HORA)} h`;
  return `${Math.round(ms / DIA)} días`;
}

const nombreCorto = (i) => Array.from(String(i.nombre || i.usuario || "sin nombre").replace(/\s+/g, " ")).slice(0, 40).join("");

function renglon(i) {
  const nota = i.nota ? ` (${i.nota})` : "";
  const dijo = i.texto === SIN_TEXTO || esFoto(i.texto) ? "(foto o adjunto)" : `«${corto(i.texto)}»`;
  return `• ${nombreCorto(i)}, hace ${haceCuanto(i.edad)}${nota}: ${dijo} ${linkCharlaIg(i.usuario) || "(sin link: no sé su usuario)"}`;
}

/** Los primeros `n` renglones de la sección, y cuántas más quedan (van en el resumen siguiente). */
function renglones(lista, n) {
  if (!lista.length) return null;
  const r = lista.slice(0, n).map(renglon);
  if (lista.length > n) r.push(`y ${lista.length - n} más (van en el próximo resumen)`);
  return `\n${r.join("\n")}`;
}

/** Lo que cuenta Telegram para su tope: el título y los campos sin las marcas, como lo arma lib/notificar.js. */
export function largoVisible(titulo, campos) {
  const filas = Object.entries(campos).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return `🔔 ${titulo}\n\n${filas.map(([k, v]) => `${k}: ${v}`).join("\n")}`.length;
}

const claveDe = (i) => `${i.seccion}:${i.hilo}:${i.mid}`;

/**
 * El resumen de las charlas que esperan a Cande. `pendientes`: lo anotado entre vueltas ([{ hilo, mid, creado,
 * nombre, usuario, texto, nota, igsid, nueva }]); `estado`: lo guardado del resumen anterior ({ en, avisadas:
 * { clave: fecha } }); `etiquetas`: [{ id, nombre, desde }], los contactos sin la etiqueta agente_dm.
 * Sale si pasaron 3 horas del anterior y trae algo que no estaba en ninguno: una charla nueva para Cande, un
 * mensaje nuevo en una que ya estaba, o una que pasó las 23 horas (esas, una sola vez). Las de Cande que ya
 * estaban van igual, después de las nuevas, para que el aviso tenga todo lo que espera. Si no entra en un mensaje
 * de Telegram, van menos renglones; solo cuenta como avisado lo que se mostró.
 * Devuelve { mandar, lista, mostradas, titulo, campos, estado }.
 */
export function armarResumen(pendientes, { ahora, estado = {}, etiquetas = [] }) {
  const t = ahora.getTime();
  const avisadas = Object.fromEntries(Object.entries(estado?.avisadas || {}).filter(([, en]) => t - hora(en) < OLVIDAR_AVISADAS_MS));
  const conEdad = pendientes.map((p) => {
    const edad = t - hora(p.creado);
    return { ...p, edad, seccion: edad >= VENTANA_AGENTE_MS ? "mano" : "vos" };
  });
  const nueva = (i) => (avisadas[claveDe(i)] ? 0 : 1);
  // Primero lo que no salió en ningún resumen (si no, lo que espera hace rato lo taparía siempre), y la que más esperó primero.
  const vos = conEdad.filter((i) => i.seccion === "vos" && i.edad >= RECORDAR_DESDE_MS).sort((a, b) => nueva(b) - nueva(a) || b.edad - a.edad);
  // Solo a mano: cada una una sola vez, la más nueva primero.
  const mano = conEdad.filter((i) => i.seccion === "mano" && nueva(i)).sort((a, b) => a.edad - b.edad);
  const sinEtiqueta = etiquetas.filter((e) => t - hora(e.desde) >= ETIQUETA_AVISO_MS).slice(0, POR_SECCION)
    .map((e) => ({ seccion: "etiqueta", hilo: e.id, mid: "", nombre: e.nombre }));
  const lista = [...vos, ...mano, ...sinEtiqueta];
  const toca = !estado?.en || t - hora(estado.en) >= RESUMEN_CADA_MS;
  if (!lista.length || !lista.some(nueva) || !toca) return { mandar: false, lista };
  let nv = Math.min(POR_SECCION, vos.length);
  let nm = Math.min(POR_SECCION, mano.length);
  const armar = () => ({
    [SECCION_VOS]: renglones(vos, nv),
    [SECCION_MANO]: renglones(mano, nm),
    [SECCION_ETIQUETA]: sinEtiqueta.length
      ? `ponésela en ManyChat para que lo que escriban le llegue al agente: ${sinEtiqueta.map(nombreCorto).join(", ")}`
      : null,
    Nota: "el agente no las tomó: contestales vos desde Instagram (el link abre la charla)",
  });
  let campos = armar();
  while (largoVisible(TITULO_RESUMEN, campos) > LARGO_AVISO && nv + nm > 1) {
    if (nv >= nm) nv--;
    else nm--;
    campos = armar();
  }
  const mostradas = [...vos.slice(0, nv), ...mano.slice(0, nm), ...sinEtiqueta];
  for (const i of mostradas) avisadas[claveDe(i)] = ahora.toISOString();
  return { mandar: true, lista, mostradas, titulo: TITULO_RESUMEN, campos, estado: { en: ahora.toISOString(), avisadas } };
}

/** Lo que se sabe de cada persona (dm_config "bandeja_ids"), sin lo vencido: su perfil y quién es en ManyChat. */
function vigentes(ids, t) {
  const r = {};
  for (const [k, g] of Object.entries(ids || {})) {
    const p = g?.p_en && t - hora(g.p_en) < REBUSCAR_HALLADA_MS ? { p_en: g.p_en, sigue: g.sigue === true, nombre: g.nombre || null } : {};
    const m = g?.m_en && t - hora(g.m_en) < (g.mc ? REBUSCAR_HALLADA_MS : REBUSCAR_NO_HALLADA_MS)
      ? { m_en: g.m_en, mc: g.mc || "", mc_nombre: g.mc_nombre || null, motivo: g.motivo || null } : {};
    if (p.p_en || m.m_en) r[k] = { ...p, ...m };
  }
  return r;
}

/**
 * Una vuelta por la bandeja. Dependencias:
 *   ig:       el cliente de lib/dm/instagram.js (cuenta, pagina, completo, perfil).
 *   base:     leerConfig, guardarConfig, contactoDeIg, contacto, guardarIg, loSigue, textosDeLaCuenta, enviadosEnLaCharla,
 *             leadsGuardados, tomar, soltar, anotarDesdeBandeja, anotarCandeDesdeIg, darDeAltaDesdeBandeja, salidaSinLlegar
 *             (lib/dm/base.js).
 *   manychat: hayManyChat, buscarPorNombre, datosDe, ponerEtiqueta (lib/dm/manychat.js).
 *   aj:       los ajustes. avisar(titulo, campos, opciones): el aviso a Cande, devuelve si salió.
 *   hasta:    pasada esa hora (ms) no se mira otra charla ni se pide otra página; el resumen sale igual.
 * Si Instagram falla al leer la primera página, tira (lo maneja el cron). Una charla que falla no frena a las
 * demás. Devuelve solo cantidades: { paginas, miradas, recuperados, altas, pendientes, fallas, resumen }.
 */
export async function revisarBandeja({
  ig, base, manychat, aj, avisar, ahora = () => new Date(), hasta = Infinity, registrar = () => {},
}) {
  const r = { paginas: 0, miradas: 0, recuperados: 0, altas: 0, pendientes: 0, fallas: 0, resumen: false };
  const t0 = ahora();
  const ms0 = t0.getTime();
  const iso0 = t0.toISOString();
  const reloj = () => ahora().getTime();
  const yo = await ig.cuenta();
  const automaticos = ((await base.leerConfig("automaticos"))?.textos || []).map(claveTexto).filter((k) => k.length >= 4);
  // Lo que salió igual en dos charlas de una misma página: solo para no tomar por Cande escribiendo a mano lo que
  // no lo es (manualEnHilo, como en lib/dm/instagram.js). Para saber si algo fue una respuesta no vale: el agente
  // repite frases (ver delAgente).
  const plantillas = new Set();
  /** Un automático cargado de ManyChat (dm_config "automaticos"): no es una respuesta al lead. */
  const esAuto = (m) => Boolean(m?.texto) && esAutomatico(m.texto, automaticos);
  const prendido = aj.modo === "auto" || aj.modo === "sombra";
  const topeRed = Number.isInteger(aj.altas_bandeja_por_dia) ? aj.altas_bandeja_por_dia : 10;
  const ids = vigentes(await base.leerConfig("bandeja_ids"), ms0);
  const pag = (await base.leerConfig("bandeja_paginas")) || {};
  const guardado = (await base.leerConfig("bandeja_estado")) || {};
  const est = {
    pendientes: Object.fromEntries(Object.entries(guardado.pendientes || {}).filter(([, p]) => p?.creado && ms0 - hora(p.creado) < OLVIDAR_AVISADAS_MS)),
    a_cande: Object.fromEntries(Object.entries(guardado.a_cande || {}).filter(([, en]) => ms0 - hora(en) < RECORDAR_A_CANDE_MS)),
    etiquetas: Object.fromEntries(Object.entries(guardado.etiquetas || {}).filter(([, e]) => e?.desde && ms0 - hora(e.desde) < ETIQUETA_OLVIDAR_MS)),
  };
  let busquedas = 0;
  let perfiles = 0;
  const vistos = new Set();
  // La charla más vieja (por cuándo se movió) que quedó para después por los topes de esta vuelta.
  let postergadaMasVieja = Infinity;
  const postergar = (h) => {
    const t = (h.actualizado || h.mensajes?.[0]?.creado)?.getTime() ?? ms0 - MIRAR_HASTA_MS;
    postergadaMasVieja = Math.min(postergadaMasVieja, t);
  };

  const poner = (i) => {
    est.pendientes[i.hilo] = i;
  };
  const quitar = (hilo) => {
    delete est.pendientes[hilo];
  };
  /** Lo que se anota de una charla para el resumen: lo último que escribió el lead sin respuesta. */
  const item = (h, pend, extra = {}) => {
    const u = pend.at(-1);
    return {
      hilo: h.id, igsid: h.otro.id, mid: String(u.id), creado: new Date(u.creado).toISOString(), usuario: h.otro.usuario || "",
      texto: corto(textoDe(u)), nombre: null, nota: null, nueva: false, ...extra,
    };
  };

  /**
   * El perfil de Instagram de la persona (si Cande la sigue, su nombre), con lo ya sabido. null: no entra en esta
   * vuelta. { falla: true }: Instagram no lo dio (se pide de nuevo en la vuelta siguiente).
   */
  async function perfilDe(otro) {
    const g = ids[otro.id];
    if (g?.p_en) return g;
    if (perfiles >= PERFILES_POR_VUELTA || reloj() >= hasta) return null;
    perfiles++;
    let p;
    try {
      p = await ig.perfil(otro.id, { conNombre: true });
    } catch (e) {
      registrar(e);
      return { falla: true };
    }
    ids[otro.id] = { ...g, p_en: iso0, sigue: p.laSigue === true, nombre: p.nombre || null };
    return ids[otro.id];
  }

  /**
   * Si Cande sigue a la persona: en su lista (con el ajuste "seguidos") o en Instagram. { sigue, falla } (falla: no
   * se pudo ver su perfil, así que no se sabe), o null: no entra en esta vuelta.
   */
  async function seguimiento(otro) {
    if (aj.seguidos === true && otro.usuario && (await base.loSigue(otro.usuario))) return { sigue: true, falla: false };
    const p = await perfilDe(otro);
    if (!p) return null;
    return p.falla ? { sigue: false, falla: true } : { sigue: p.sigue === true, falla: false };
  }

  /** Quién es en ManyChat (con lo ya sabido de vueltas anteriores). { id, nombre, motivo } o { despues }. */
  async function quienEs(otro, p) {
    const g = ids[otro.id];
    const nombreIg = p?.nombre || null;
    if (g?.m_en) return { id: g.mc || null, nombre: nombreIg || g.mc_nombre || null, motivo: g.mc ? null : g.motivo || NO_HALLADA };
    if (!manychat.hayManyChat()) return { id: null, nombre: nombreIg, motivo: "falta la clave de ManyChat" };
    if (busquedas >= BUSQUEDAS_POR_VUELTA || reloj() >= hasta) return { despues: true };
    busquedas++;
    const q = await identificar(manychat, { igsid: otro.id, usuario: otro.usuario || "", nombres: [nombreIg, otro.usuario], hasta, ahora: reloj });
    const nombre = nombreIg || q.nombre || null;
    if (q.falla) return { id: null, nombre, motivo: "ManyChat no contestó" }; // se busca de nuevo en la vuelta siguiente
    const motivo = q.id ? null : q.varios ? "hay más de un contacto con ese usuario en ManyChat" : NO_HALLADA;
    ids[otro.id] = { ...ids[otro.id], m_en: iso0, mc: q.id || "", mc_nombre: q.nombre || null, motivo };
    return { id: q.id, nombre, motivo };
  }

  /** La etiqueta agente_dm en ManyChat: sin ella, lo que escriba después no le llega al agente. Si falla, se reintenta. */
  async function etiquetar(id, nombre) {
    let ok = false;
    try {
      ok = (await manychat.ponerEtiqueta(id, ETIQUETA_AGENTE))?.ok === true;
    } catch (e) {
      registrar(e);
    }
    if (ok) delete est.etiquetas[id];
    else if (!est.etiquetas[id]) est.etiquetas[id] = { nombre: nombre || null, desde: iso0 };
    return ok;
  }

  /**
   * Las marcas de retomada (dm_config "retomadas") si la charla del agente `c` se mira con su marca (marcaParaElHilo,
   * lib/dm/instagram.js), o null: se mira como en main. Solo le pregunta a la base si la cuenta escribió algo en la
   * charla desde que es del agente. Si la base no deja leer la marca, null (queda en el registro): como en main.
   */
  async function marcasParaElHilo(c, h) {
    if (!escribioLaCuenta(h, yo, desdeManual(c))) return null;
    let marcas;
    try {
      marcas = await base.leerConfig(CLAVE_RETOMADAS);
    } catch (e) {
      registrar(e);
      return null;
    }
    return marcaParaElHilo(marcas, c, h, yo, ahora()) ? marcas : null;
  }

  /**
   * Una charla del agente: guarda lo que no llegó por la entrada y deja el turno abierto para la espera. Lo que salió
   * de la cuenta se reconoce con lo que la base sabe que mandaron el agente o Cande en esta charla: eso es una
   * respuesta que llegó, aunque la frase se repita en otras charlas. Lo único que no cuenta como respuesta es un
   * automático cargado que no está entre lo que mandaron ellos (una palabra clave que se tragó el mensaje).
   */
  async function delAgente(c, { h }) {
    const enviados = (await base.enviadosEnLaCharla(c.id)).map(claveTexto).filter((k) => k.length >= 4);
    const noResponde = (m) => esAuto(m) && !esConocida(claveTexto(m.texto), enviados);
    const pend = sinRespuesta(h, yo, noResponde);
    if (!pend.length) return quitar(h.id); // en Instagram, lo último del lead ya tiene respuesta
    const faltan = faltantes(pend, await base.leadsGuardados(c.id), ultimaDeLaCuenta(h, yo, noResponde));
    const edad = ms0 - pend.at(-1).creado;
    if (!faltan.length) {
      // Todo está en la base. Si el agente figura con la respuesta enviada y en Instagram no aparece, no llegó.
      const desde = new Date(hora(pend.find((m) => m.creado)?.creado || pend.at(-1).creado) - DESFASE_MS).toISOString();
      if (edad >= SIN_LLEGAR_MS && (await base.salidaSinLlegar(c.id, desde))) {
        poner(item(h, pend, { nombre: c.nombre, nota: "el agente le contestó pero no le llegó por Instagram" }));
      } else {
        quitar(h.id); // lo contesta la espera (o el agente ya decidió qué hacer)
      }
      return;
    }
    if (edad >= VENTANA_AGENTE_MS) return poner(item(h, pend, { nombre: c.nombre, nota: "el mensaje no le llegó al agente" }));
    // Cande escribió "--" o a mano: la vuelta de /api/dm/instagram saca al agente de ahí. No se le guarda nada y,
    // mientras nadie conteste, va al resumen. En una charla retomada (lib/dm/instagram.js), lo que escribió a mano con
    // la marca no la saca: queda anotado como suyo antes que lo del lead (aunque haya pegado el mismo texto en otras
    // charlas de la vuelta), y lo que el lead escribió después lo contesta la espera.
    if (codigoEnHilo(h, yo, desdeDe(c))) return poner(item(h, pend, { nombre: c.nombre, nota: "escribiste --: el agente no se metió" }));
    // Sin la marca de retomada (o si la base no deja leerla), como en main.
    const marcas = await marcasParaElHilo(c, h);
    let manuales = [];
    let retomada = false;
    if (!marcas) {
      if (manualEnHilo(h, yo, [...(await base.textosDeLaCuenta(c.id)), ...plantillas], desdeManual(c))) {
        return poner(item(h, pend, { nombre: c.nombre, nota: "le escribiste vos: el agente no se metió" }));
      }
    } else {
      const conocidos = await base.textosDeLaCuenta(c.id);
      const conMarca = await conLaMarca(h, yo, c, marcas, base.textosDeLaCuenta, automaticosCargados(base.leerConfig));
      manuales = manualesConPlantillas(h, yo, c, { conocidos, plantillas, retomadas: marcas, conMarca });
      retomada = seAnotaComoRetomada(c, manuales, marcas);
      if (manuales.length && !retomada) return poner(item(h, pend, { nombre: c.nombre, nota: "le escribiste vos: el agente no se metió" }));
    }
    const marca = randomUUID();
    if (!(await base.tomar(c.id, marca))) return; // la está contestando otra corrida: la vuelta siguiente
    let n = 0;
    try {
      if (retomada) await base.anotarCandeDesdeIg(c.id, manuales.map(paraAnotarDeCande));
      n = await base.anotarDesdeBandeja(c.id, faltan.map(paraGuardar));
    } finally {
      await base.soltar(c.id, marca);
    }
    r.recuperados += n;
    quitar(h.id);
    // Si se perdió un mensaje, que la etiqueta esté: es la que hace que ManyChat se los pase al agente.
    if (n) await etiquetar(c.id, c.nombre);
  }

  /**
   * Una charla de Cande: no se toca. Al resumen, salvo que sea personal, que la siga Cande, o que lo último del lead
   * lo haya contestado un automático de ManyChat.
   */
  async function deCande(c, { h, estricto }) {
    if (!estricto.length || c.personal === true) return quitar(h.id);
    const s = await seguimiento(h.otro);
    if (!s) return postergar(h); // no hay lugar para pedir su perfil en esta vuelta
    if (s.sigue) return quitar(h.id);
    poner(item(h, estricto, { nombre: c.nombre })); // sin el perfil, también: no se calla nada por una falla
  }

  const conContacto = (c, ver) => (c.dueno === "agente" ? delAgente(c, ver) : deCande(c, ver));

  /** Llegó a lo más que le deja la red por día: un aviso, como el de la entrada. */
  async function avisarTope(van) {
    try {
      await avisar("DM: se llenó el tope de altas de la red de la bandeja", {
        "Van en 24 horas": `${van} de ${topeRed}`,
        Aviso: "no entra nadie nuevo por la bandeja hasta que pasen 24 horas de las primeras: las que no entren te llegan en el resumen",
      }, { contestable: false });
    } catch (e) {
      registrar(e);
    }
  }

  /**
   * Alguien que la base no reconoce por su Instagram. Si en ManyChat es un contacto que la base ya tiene (todavía
   * sin su usuario o su id de Instagram), queda guardado y sigue como cualquier charla de su dueño. Si no, entra
   * como alta, salvo que Cande le haya escrito (no se toma) o que el agente no pueda tomarlo (apagado, altas
   * apagadas, tope, no se sabe quién es en ManyChat): esas van al resumen, nunca quedan calladas.
   */
  async function sinContacto(ver) {
    const { h, estricto } = ver;
    if (!estricto.length) return quitar(h.id); // le contestó un automático de ManyChat: es el embudo (DEV, CV, bienvenida)
    const s = await seguimiento(h.otro);
    if (!s) return postergar(h);
    if (s.sigue) return quitar(h.id);
    // Sin su perfil no se sabe si Cande la sigue: no hay alta en esta vuelta (ni se la busca en ManyChat, que la
    // busca por el nombre del perfil). Queda anotada: si sigue así, le llega a Cande en el resumen.
    if (s.falla) return poner(item(h, estricto, { nota: "no pude ver su perfil de Instagram (si la seguís): el agente no la tomó", nueva: true }));
    const q = await quienEs(h.otro, ids[h.otro.id]);
    if (q.despues) return postergar(h);
    if (q.id) {
      const c = await base.contacto(q.id);
      if (c) {
        // Su Instagram queda solo si la charla es del agente: a una personal o borrada no se le vuelve a poner.
        await base.guardarIg(c.id, { igId: h.otro.id, usuario: h.otro.usuario || null, soloDelAgente: true });
        return conContacto(c, ver);
      }
    }
    const nombre = q.nombre || null;
    const vos = (nota) => poner(item(h, estricto, { nombre, nota, nueva: true }));
    if (est.a_cande[h.otro.id]) return vos("ya te la había pasado: la tenés vos");
    if (aManoSinContacto(h, yo, automaticos)) {
      return vos(codigoEnHilo(h, yo) ? "escribiste --: el agente no se metió" : "hay mensajes tuyos: el agente no se metió");
    }
    if (ms0 - estricto.at(-1).creado >= VENTANA_AGENTE_MS) return vos("nunca le llegó al agente");
    let motivo = q.motivo;
    if (q.id) {
      if (!prendido) motivo = "el agente está apagado";
      else if (aj.altas !== true) motivo = "las altas están apagadas";
      else {
        const alta = await base.darDeAltaDesdeBandeja(q.id, {
          nombre, mensajes: estricto.map(paraGuardar), contexto: aj.contexto_alta, tope: topeRed, igId: h.otro.id, usuario: h.otro.usuario || null,
        });
        if (alta.guardados) {
          r.altas++;
          quitar(h.id);
          await etiquetar(q.id, nombre);
          if (alta.van + 1 >= topeRed) await avisarTope(alta.van + 1);
          return;
        }
        if (await base.contacto(q.id)) return; // entró recién por la entrada: la ve la vuelta siguiente
        motivo = "se llenó el tope de altas de la red";
      }
    }
    vos(`nueva, no entró al agente: ${motivo}`);
  }

  /** Una charla de la lista. Lo que falla (Instagram, la base, ManyChat) queda para la vuelta siguiente. */
  async function mirar(h0) {
    if (!h0?.id || vistos.has(h0.id)) return;
    vistos.add(h0.id);
    if (h0.actualizado && ms0 - h0.actualizado.getTime() > MIRAR_HASTA_MS) return;
    r.miradas++;
    try {
      // Primero quién escribió lo último (un pedido como mucho); la charla entera, solo si fue el lead o un automático.
      const h1 = await ig.completo(h0, 1);
      const m0 = h1.mensajes[0];
      if (!m0?.de) return;
      if (esDeLaCuenta(m0.de, yo) && !esAuto(m0)) return quitar(h0.id);
      const h = await ig.completo(h0);
      // Lo más que puede estar sin respuesta (salteando los automáticos cargados). Qué cuenta como respuesta en cada
      // charla lo decide quien la tiene (delAgente, deCande, sinContacto): esto es solo para saber si hay algo.
      const ultimo = sinRespuesta(h, yo, esAuto).at(-1);
      if (!ultimo) return quitar(h.id);
      if (!h.otro?.id || !ultimo.creado) return;
      const edad = ms0 - ultimo.creado.getTime();
      if (edad < GRACIA_MS) return; // puede estar entrando por el webhook, y el agente contestando
      if (edad > MIRAR_HASTA_MS) return quitar(h.id);
      const ver = { h, estricto: sinRespuesta(h, yo) };
      let c = await base.contactoDeIg({ igId: h.otro.id, usuario: h.otro.usuario });
      if (c && c.ig_id && c.ig_id !== h.otro.id) c = null; // otra persona con ese usuario
      if (c && !c.ig_id) await base.guardarIg(c.id, { igId: h.otro.id, soloDelAgente: true });
      if (c) await conContacto(c, ver);
      else await sinContacto(ver);
    } catch (e) {
      r.fallas++;
      registrar(e); // una charla que falla no frena a las demás
    }
  }

  /**
   * Lee páginas desde el cursor `desde` (null: la primera) hasta la que llega a `limite` (ms, por la hora en que se
   * movió la charla), hasta que no haya más, o hasta quedarse sin tiempo. Devuelve { completo, cursor, fallo }:
   * completo, el cursor de la página que sigue; cortado, el de la página que quedó a medias (null: la que sigue a la
   * primera lectura de la vuelta siguiente), para leerla de nuevo. Si falla la primera página de la vuelta, tira; si
   * falla otra, corta ahí (fallo).
   */
  async function leer(desde, limite, { primera = false } = {}) {
    let cursor = desde;
    for (;;) {
      if (r.paginas >= PAGINAS_POR_VUELTA || (!primera && reloj() >= hasta - MARGEN_PAGINA_MS)) return { completo: false, cursor };
      let p;
      try {
        p = await ig.pagina({ limite: CHARLAS_POR_PAGINA, mensajes: MENSAJES_POR_CHARLA, despues: cursor });
      } catch (e) {
        if (primera) throw e;
        registrar(e);
        return { completo: false, cursor, fallo: true };
      }
      primera = false;
      r.paginas++;
      for (const k of plantillasDe(p.lista, yo)) plantillas.add(k);
      for (const h0 of p.lista) {
        if (reloj() >= hasta) return { completo: false, cursor };
        await mirar(h0);
      }
      const ultima = p.lista.at(-1)?.actualizado;
      if (!p.despues || (ultima && ultima.getTime() <= limite)) return { completo: true, cursor: p.despues };
      cursor = p.despues;
    }
  }

  // 1. Arriba: las charlas movidas desde la vuelta anterior (la primera vez, las de toda la última semana).
  const marca = fecha(pag.marca);
  const tocaRepaso = !fecha(pag.repaso_en) || ms0 - fecha(pag.repaso_en) >= REPASO_CADA_MS;
  const objetivoRepaso = ms0 - (marca ? REPASO_HASTA_MS : MIRAR_HASTA_MS);
  const limiteArriba = marca ? marca - SOLAPE_MS : objetivoRepaso;
  const nuevaPag = { marca: iso0, repaso_en: pag.repaso_en || null, cursor: null, objetivo: null };
  const arriba = await leer(null, limiteArriba, { primera: true });
  // 2. Abajo: lo que dejó a medias una vuelta cortada, y el repaso de las últimas 25 horas si toca.
  let deuda = Math.min(fecha(pag.objetivo) ?? Infinity, tocaRepaso ? objetivoRepaso : Infinity);
  if (!marca && arriba.completo) {
    nuevaPag.repaso_en = iso0; // la primera lectura ya fue el repaso
    deuda = Infinity;
  }
  if (!arriba.completo) {
    nuevaPag.cursor = arriba.cursor;
    nuevaPag.objetivo = new Date(Math.min(limiteArriba, deuda)).toISOString();
  } else if (deuda !== Infinity) {
    const inicio = pag.cursor || arriba.cursor;
    const abajo = inicio ? await leer(inicio, deuda) : { completo: true };
    if (!abajo.completo) {
      // Lo que falta, para la vuelta siguiente. Si falló una página (un cursor vencido, Instagram), se sigue desde
      // donde termine la lectura de arriba de esa vuelta.
      nuevaPag.cursor = abajo.fallo ? null : abajo.cursor || inicio;
      nuevaPag.objetivo = new Date(deuda).toISOString();
    } else if (deuda <= objetivoRepaso) nuevaPag.repaso_en = iso0;
  }
  // 3. Lo que quedó para después por los topes (búsquedas, perfiles, tiempo) y que el próximo repaso no vuelve a leer
  // (la primera vuelta mira toda la semana; el repaso, 25 horas): la vuelta siguiente lee desde arriba hasta ahí.
  if (postergadaMasVieja < ms0 - RELEE_EL_REPASO_MS) {
    nuevaPag.cursor = null; // desde arriba: lo postergado pudo quedar encima de donde se cortó la lectura
    nuevaPag.objetivo = new Date(Math.min(fecha(nuevaPag.objetivo) ?? Infinity, postergadaMasVieja)).toISOString();
  }

  // Las etiquetas que no se pudieron poner en otra vuelta: unas pocas por vuelta. Si la charla ya no es del agente, se deja.
  const debidas = Object.entries(est.etiquetas).filter(([, e]) => hora(e.desde) < ms0)
    .sort(([, a], [, b]) => hora(a.desde) - hora(b.desde)).slice(0, ETIQUETAS_POR_VUELTA);
  for (const [id, e] of debidas) {
    if (reloj() >= hasta) break;
    try {
      const c = await base.contacto(id);
      if (c?.dueno !== "agente") delete est.etiquetas[id];
      else await etiquetar(id, e.nombre);
    } catch (err) {
      registrar(err);
    }
  }

  const res = armarResumen(Object.values(est.pendientes), {
    ahora: t0, estado: await base.leerConfig("bandeja_resumen"),
    etiquetas: Object.entries(est.etiquetas).map(([id, e]) => ({ id, ...e })),
  });
  r.pendientes = res.lista.length;
  if (res.mandar) {
    let salio = false;
    try {
      salio = await avisar(res.titulo, res.campos, { contestable: false });
    } catch {
      salio = false;
    }
    if (salio) {
      await base.guardarConfig("bandeja_resumen", res.estado);
      r.resumen = true;
      // A quien se le pasó como nueva en "Pasadas a vos" no entra después como alta: se le dijo a Cande que la conteste.
      for (const i of res.mostradas) if (i.nueva && i.seccion === "vos" && i.igsid) est.a_cande[i.igsid] = iso0;
    }
  }

  await base.guardarConfig("bandeja_ids", ids);
  await base.guardarConfig("bandeja_estado", est);
  // Al final: es la constancia de que la vuelta salió entera (la mira vigilarRed).
  await base.guardarConfig("bandeja_paginas", nuevaPag);
  return r;
}

/**
 * Si la red no logra una vuelta entera hace media hora (Instagram que limita o tarda durante horas, la base, una
 * vuelta que Vercel corta por tiempo, lo que sea), se avisa una vez por caída: sin esto, si algo no anda nadie se
 * entera. Una vuelta entera es la que guardó "bandeja_paginas" (su marca). El cron la llama al empezar cada vuelta
 * (`alEmpezar`: anota el intento, y si el anterior no terminó es una caída) y cuando una vuelta falla (`error`).
 * Si nunca hubo una vuelta entera, cuenta desde el primer intento. Devuelve si avisó.
 */
export async function vigilarRed({ base, avisar, error = null, alEmpezar = false, ahora = () => new Date() }) {
  const t = ahora();
  const ms = t.getTime();
  const pag = await base.leerConfig("bandeja_paginas");
  const salud = (await base.leerConfig("bandeja_salud")) || {};
  const buena = fecha(pag?.marca);
  const intento = fecha(salud.intento_en);
  // Una caída: esta vuelta falló, o después de la última vuelta entera hubo un intento que no terminó.
  const cayo = !alEmpezar || (intento !== null && (buena === null || intento > buena));
  const desde = buena ?? fecha(salud.primero);
  const avisada = fecha(salud.avisada_en);
  let salio = false;
  if (cayo && desde !== null && ms - desde >= RED_CAIDA_MS && !(avisada !== null && avisada >= desde)) {
    try {
      salio = await avisar("DM: la red de la bandeja no anda", {
        "Sin una vuelta entera hace": haceCuanto(ms - desde),
        Motivo: error ? explicarError(error) : "las vueltas no terminan: se cortan por tiempo o fallan sin decir por qué",
        Nota: "mientras tanto lo que no llegue por ManyChat no lo ve nadie: mirá la bandeja de Instagram",
      }, { contestable: false });
    } catch {
      salio = false;
    }
  }
  const nueva = { ...salud };
  if (salio) nueva.avisada_en = t.toISOString();
  if (alEmpezar) nueva.intento_en = t.toISOString();
  if (buena === null && !salud.primero) nueva.primero = t.toISOString();
  if (JSON.stringify(nueva) !== JSON.stringify(salud)) await base.guardarConfig("bandeja_salud", nueva);
  return salio;
}
