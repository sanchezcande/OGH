// La red de la bandeja (20/10). Cande: "ya al menos 10 veces te dije que no queden charlas sin contestar".
//
// Por qué quedaban: al agente le llega solo lo que manda el webhook de ManyChat (pages/api/dm/entrada.js). Si
// ManyChat no lo manda, nadie se entera. En la bandeja real, de 150 charlas desde el 18/10, en 36 lo último lo
// había escrito el lead: 8 personas nuevas que nunca entraron a la base, 4 mensajes de charlas del agente que no
// llegaron, 16 charlas pasadas a Cande que ella no llegó a contestar, y lo que pasó las 24 horas sin respuesta.
//
// Qué hace: mira la bandeja de verdad (no la base) cada 3 minutos (pages/api/dm/bandeja.js). De las 50 charlas
// movidas más recientes, toma las que tienen lo último escrito por el lead, sin respuesta:
//   - Alguien que el agente no conoce: se lo busca en ManyChat y, si ManyChat confirma que es esa cuenta de
//     Instagram, entra como un alta (lo mismo que hace la entrada) con sus mensajes. Lo contesta la espera.
//   - Una charla del agente con mensajes del lead que no están en la base: se guardan con la hora en que los
//     escribió y el turno queda abierto. Lo contesta la espera (pages/api/dm/espera.js).
//   - Una charla de Cande: no se toca. Va al resumen.
//   - Lo que esperó más de 23 horas: el agente ya no llega (la espera toma hasta 23 horas). Va al resumen.
// Lo más nuevo (3 minutos) se deja: puede estar entrando por el webhook, y el agente contestando.
//
// No se toca, como en el resto del agente: a quien sigue Cande (en Instagram o en su lista, dm_seguidos), una
// charla donde ella escribió "--" o le escribió a mano, ni una charla personal (la que el agente ya le dejó a
// Cande sin guardar nada: no tiene nada del lead en la base). Una de esas que nadie contestó y no es personal ni de
// alguien que ella sigue va al resumen: quedarse callada nunca. Un alta nueva pasa por lo de siempre: si el modelo
// dice que es personal, se borra y queda de Cande sin aviso. Con el agente apagado o las altas apagadas no entra
// nadie nuevo (va al resumen). Los mensajes perdidos de una charla del agente se guardan igual, como haría la
// entrada: con el agente apagado, el cron de los toques se la pasa a Cande.
//
// Nunca dos respuestas al mismo mensaje: cada mensaje guardado por acá lleva su id de Instagram (ig_mid, único
// en la base); lo que ya entró por la entrada se reconoce por texto y hora; si el webhook llega después, la
// entrada no lo guarda otra vez (base.entroPorLaBandeja); y en una charla del agente se escribe con su traba
// (tomar y soltar): si alguien la está contestando, queda para la vuelta siguiente. La espera tiene las suyas
// (reclamarEspera, quizas_salio).
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
// "Pasadas a vos": charlas de Cande (y nuevas que el agente no pudo tomar) que esperan hace más de 20 minutos y
// todavía se pueden contestar. "Más de 23 h, solo a mano": cada una sale una sola vez. Sin nada, no sale nada.
//
// Todo entra por parámetro para probarlo sin red ni base (tests/dmBandeja.test.mjs).
import { randomUUID } from "node:crypto";
import { SIN_TEXTO, esFoto } from "./agente";
import {
  claveTexto, codigoEnHilo, desdeDe, desdeManual, esDeLaCuenta, linkCharlaIg, manualEnHilo, plantillasDe, usuarioIg,
} from "./instagram";
import { esCodigoSalir } from "./respuestas";

const MIN = 60000;
const HORA = 60 * MIN;
const DIA = 24 * HORA;

export const CHARLAS_POR_VUELTA = 50;
const MENSAJES_POR_CHARLA = 10;
/** Lo más nuevo se deja: puede estar entrando por el webhook de ManyChat, y el agente contestando. */
export const GRACIA_MS = 3 * MIN;
/** Hasta acá el agente llega: la espera (base.sinContestar) toma lo de las últimas 23 horas. */
export const VENTANA_AGENTE_MS = 23 * HORA;
/** Lo más viejo que se mira, como base.sinVentana. */
export const MIRAR_HASTA_MS = 7 * DIA;
export const RESUMEN_CADA_MS = 3 * HORA;
/** Una charla para Cande entra al resumen si esperó por lo menos esto (recién le pudo llegar el aviso de la charla). */
export const RECORDAR_DESDE_MS = 20 * MIN;
/** Quién es en ManyChat se busca de nuevo pasado esto (no encontrada) o esto otro (encontrada, o la sigue Cande). */
const REBUSCAR_NO_HALLADA_MS = 30 * MIN;
const REBUSCAR_HALLADA_MS = 2 * HORA;
/** Búsquedas en ManyChat por vuelta: cada una puede tardar varios pedidos. Las que no entran, a la vuelta siguiente. */
export const BUSQUEDAS_POR_VUELTA = 6;
const CANDIDATOS_POR_NOMBRE = 5;
/** Lo que ya salió en un resumen se recuerda 8 días (lo más viejo que se mira son 7). */
const OLVIDAR_AVISADAS_MS = 8 * DIA;
/** Renglones por sección: el aviso tiene que entrar en un mensaje de Telegram. */
const POR_SECCION = 10;
/** Diferencia de relojes entre Instagram y la base que se tolera al comparar horas. */
const DESFASE_MS = 15000;

export const TITULO_RESUMEN = "DM: charlas que esperan respuesta tuya";
export const SECCION_VOS = "Pasadas a vos";
export const SECCION_MANO = "Más de 23 h, solo a mano";
const NO_HALLADA = "no la encontré en ManyChat";

/** El texto de un mensaje de la bandeja como lo guardaría la entrada: sin texto (una foto, un audio), SIN_TEXTO. */
export const textoDe = (m) => String(m?.texto ?? "").trim().slice(0, 4000) || SIN_TEXTO;

/**
 * Los mensajes del lead que no tienen respuesta: los del final de la charla, posteriores al mensaje más nuevo de la
 * cuenta, en el orden en que los escribió. Vacío si lo último es de la cuenta. Un mensaje sin autor (no se pudo
 * leer) corta: no se sabe de quién es.
 */
export function sinRespuesta(h, cuenta) {
  const lista = [];
  for (const m of h?.mensajes || []) { // Instagram los da de los más nuevos a los más viejos
    if (!m.de || esDeLaCuenta(m.de, cuenta)) break;
    lista.push(m);
  }
  return lista.reverse();
}

/** La hora del mensaje más nuevo de la cuenta en la charla, o null si no se ve ninguno. */
export function ultimaDeLaCuenta(h, cuenta) {
  const m = (h?.mensajes || []).find((x) => esDeLaCuenta(x.de, cuenta));
  return m?.creado || null;
}

/** Si lo guardado y lo de la bandeja son el mismo mensaje por su texto (una foto es una foto, con o sin link). */
export function mismoTexto(guardado, m) {
  const a = String(guardado ?? "").trim();
  const b = textoDe(m);
  if (a === b) return true;
  const ka = claveTexto(a);
  if (ka && ka === claveTexto(b)) return true;
  return esFoto(a) && esFoto(b);
}

const hora = (d) => new Date(d).getTime();

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

/** Si un texto de la cuenta es uno de los conocidos: igual, o con 30 letras iguales al principio o al final (el nombre de la persona en el medio). */
export function esConocida(k, conocidas) {
  return conocidas.some((c) => c === k || (Math.min(k.length, c.length) >= 30 &&
    (c.includes(k.slice(0, 30)) || c.includes(k.slice(-30)) || k.includes(c.slice(0, 30)) || k.includes(c.slice(-30)))));
}

/**
 * Si en la charla de alguien que el agente no conoce hay algo que Cande escribió a mano: lo que salió de la cuenta y
 * no es un automático (un texto que salió también en otras charlas, o de los automáticos cargados). "Cande aquí"
 * al principio es ella. Lo dudoso cuenta como de ella: el agente no se mete.
 */
export function aManoSinContacto(h, cuenta, conocidas) {
  for (const m of h?.mensajes || []) {
    if (!esDeLaCuenta(m.de, cuenta) || !m.texto) continue;
    const k = claveTexto(m.texto);
    if (k.startsWith("candeaqui") && !conocidas.includes(k)) return true;
    if (k.length >= 4 && !esConocida(k, conocidas)) return true;
  }
  return false;
}

/** El "--" (o /yo) de Cande en la charla, en cualquier momento. */
const hayCodigo = (h, cuenta) => (h?.mensajes || []).some((m) => esDeLaCuenta(m.de, cuenta) && m.texto != null && esCodigoSalir(m.texto));

/** Las claves de lo que salió de la cuenta en las otras charlas de la lista. */
function clavesDeOtras(lista, cuenta, hilo) {
  const claves = new Set();
  for (const h of lista) {
    if (h.id === hilo) continue;
    for (const m of h.mensajes) if (esDeLaCuenta(m.de, cuenta) && m.texto) claves.add(claveTexto(m.texto));
  }
  return [...claves].filter((k) => k.length >= 4);
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

function renglon(i) {
  const nombre = Array.from(String(i.nombre || i.usuario || "sin nombre").replace(/\s+/g, " ")).slice(0, 40).join("");
  const nota = i.nota ? ` (${i.nota})` : "";
  const dijo = i.texto === SIN_TEXTO || esFoto(i.texto) ? "(foto o adjunto)" : `«${corto(i.texto)}»`;
  return `• ${nombre}, hace ${haceCuanto(i.edad)}${nota}: ${dijo} ${linkCharlaIg(i.usuario) || "(sin link: no sé su usuario)"}`;
}

function renglones(lista) {
  if (!lista.length) return null;
  const r = lista.slice(0, POR_SECCION).map(renglon);
  if (lista.length > POR_SECCION) r.push(`y ${lista.length - POR_SECCION} más`);
  return `\n${r.join("\n")}`;
}

const claveDe = (i) => `${i.seccion}:${i.hilo}:${i.mid}`;

/**
 * El resumen de las charlas que esperan a Cande. `items`: [{ seccion: "vos" | "mano", hilo, mid, edad, nombre,
 * usuario, texto, nota }]; `estado`: lo guardado del resumen anterior ({ en, avisadas: { clave: fecha } }).
 * Sale si pasaron 3 horas del anterior y trae algo que no estaba en ninguno: una charla nueva para Cande, un
 * mensaje nuevo en una que ya estaba, o una que pasó las 23 horas (esas, una sola vez). Las de Cande que ya
 * estaban van igual, para que el aviso tenga todo lo que espera. Devuelve { mandar, lista, titulo, campos, estado }.
 */
export function armarResumen(items, { ahora, estado = {} }) {
  const t = ahora.getTime();
  const avisadas = Object.fromEntries(Object.entries(estado?.avisadas || {}).filter(([, en]) => t - hora(en) < OLVIDAR_AVISADAS_MS));
  const masEsperaron = (a, b) => b.edad - a.edad;
  const vos = items.filter((i) => i.seccion === "vos" && i.edad >= RECORDAR_DESDE_MS).sort(masEsperaron);
  const mano = items.filter((i) => i.seccion === "mano" && !avisadas[claveDe(i)]).sort(masEsperaron);
  const lista = [...vos, ...mano];
  const hayAlgoNuevo = lista.some((i) => !avisadas[claveDe(i)]);
  const toca = !estado?.en || t - hora(estado.en) >= RESUMEN_CADA_MS;
  if (!lista.length || !hayAlgoNuevo || !toca) return { mandar: false, lista };
  for (const i of lista) avisadas[claveDe(i)] = ahora.toISOString();
  return {
    mandar: true, lista, titulo: TITULO_RESUMEN,
    campos: {
      [SECCION_VOS]: renglones(vos),
      [SECCION_MANO]: renglones(mano),
      Nota: "el agente no las tomó: contestales vos desde Instagram (el link abre la charla)",
    },
    estado: { en: ahora.toISOString(), avisadas },
  };
}

/** Lo que se sabe de quién es cada persona en ManyChat (dm_config "bandeja_ids"), sin lo vencido. */
function vigentes(ids, t) {
  return Object.fromEntries(Object.entries(ids || {}).filter(([, g]) =>
    g?.en && t - hora(g.en) < (g.mc || g.sigue ? REBUSCAR_HALLADA_MS : REBUSCAR_NO_HALLADA_MS)));
}

/**
 * Una vuelta por la bandeja. Dependencias:
 *   ig:       el cliente de lib/dm/instagram.js (cuenta, hilos, completo, perfil).
 *   base:     leerConfig, guardarConfig, contactoDeIg, contacto, guardarIg, loSigue, textosDeLaCuenta, leadsGuardados,
 *             fueDelAgente, tomar, soltar, anotarDesdeBandeja, darDeAltaDesdeBandeja (lib/dm/base.js).
 *   manychat: hayManyChat, buscarPorNombre, datosDe (lib/dm/manychat.js).
 *   aj:       los ajustes. avisar(titulo, campos, opciones): el aviso a Cande, devuelve si salió.
 *   hasta:    pasada esa hora (ms) no se mira otra charla; el resumen sale igual.
 * Si Instagram falla al leer la lista o una charla, tira (lo maneja el cron). Una charla que falla por otra cosa no
 * frena a las demás. Devuelve solo cantidades: { miradas, recuperados, altas, pendientes, resumen }.
 */
export async function revisarBandeja({
  ig, base, manychat, aj, avisar, ahora = () => new Date(), hasta = Infinity, limite = CHARLAS_POR_VUELTA, registrar = () => {},
}) {
  const r = { miradas: 0, recuperados: 0, altas: 0, pendientes: 0, resumen: false };
  const t0 = ahora();
  const reloj = () => ahora().getTime();
  const yo = await ig.cuenta();
  const lista = await ig.hilos({ limite, mensajes: MENSAJES_POR_CHARLA });
  const plantillas = plantillasDe(lista, yo);
  const automaticos = ((await base.leerConfig("automaticos"))?.textos || []).map(claveTexto).filter((k) => k.length >= 4);
  const prendido = aj.modo === "auto" || aj.modo === "sombra";
  const ids = vigentes(await base.leerConfig("bandeja_ids"), t0.getTime());
  let idsCambiaron = false;
  let busquedas = 0;
  const items = [];

  /** Quién es en ManyChat (con lo ya sabido de vueltas anteriores). { id, nombre, motivo } o { laSigue } o { despues }. */
  async function quienEs(otro) {
    const g = ids[otro.id];
    if (g) return g.sigue ? { laSigue: true } : { id: g.mc || null, nombre: g.nombre || null, motivo: g.mc ? null : g.motivo || NO_HALLADA };
    if (busquedas >= BUSQUEDAS_POR_VUELTA || reloj() >= hasta) return { despues: true };
    busquedas++;
    const recordar = (dato) => {
      ids[otro.id] = { ...dato, en: t0.toISOString() };
      idsCambiaron = true;
    };
    let p = null;
    try {
      p = await ig.perfil(otro.id, { conNombre: true });
    } catch (e) {
      registrar(e); // sin el perfil se busca por el usuario de la charla
    }
    if (p?.laSigue) {
      recordar({ sigue: true });
      return { laSigue: true };
    }
    const usuario = otro.usuario || p?.usuario || "";
    if (!manychat.hayManyChat()) return { id: null, nombre: p?.nombre || null, motivo: "falta la clave de ManyChat" };
    const q = await identificar(manychat, { igsid: otro.id, usuario, nombres: [p?.nombre, usuario], hasta, ahora: reloj });
    const nombre = p?.nombre || q.nombre || null;
    if (q.falla) return { id: null, nombre, motivo: "ManyChat no contestó" }; // se busca de nuevo en la vuelta siguiente
    const motivo = q.id ? null : q.varios ? "hay más de un contacto con ese usuario en ManyChat" : NO_HALLADA;
    recordar({ mc: q.id || "", nombre, motivo });
    return { id: q.id, nombre, motivo };
  }

  /** Una charla del agente: guarda lo que no llegó por la entrada y deja el turno abierto para la espera. */
  async function delAgente(c, h, pend, item) {
    const faltan = faltantes(pend, await base.leadsGuardados(c.id), ultimaDeLaCuenta(h, yo));
    if (!faltan.length) return; // ya está en la base: lo contesta la espera (o el agente ya decidió qué hacer)
    if (item.edad >= VENTANA_AGENTE_MS) {
      items.push({ ...item, seccion: "mano", nombre: c.nombre, nota: "el mensaje no le llegó al agente" });
      return;
    }
    // Cande escribió "--" o a mano: la vuelta de /api/dm/instagram saca al agente de ahí. No se le guarda nada.
    if (codigoEnHilo(h, yo, desdeDe(c))) return;
    if (manualEnHilo(h, yo, [...(await base.textosDeLaCuenta(c.id)), ...plantillas], desdeManual(c))) return;
    const marca = randomUUID();
    if (!(await base.tomar(c.id, marca))) return; // la está contestando otra corrida: la vuelta siguiente
    try {
      r.recuperados += await base.anotarDesdeBandeja(c.id, faltan.map(paraGuardar));
    } finally {
      await base.soltar(c.id, marca);
    }
  }

  /** Una charla de Cande: no se toca. Al resumen, si pasó por el agente (una personal, no) y no la sigue. */
  async function deCande(c, item) {
    if (!(await base.fueDelAgente(c.id))) return;
    if (aj.seguidos === true && item.usuario && (await base.loSigue(item.usuario))) return;
    items.push({ ...item, seccion: item.edad >= VENTANA_AGENTE_MS ? "mano" : "vos", nombre: c.nombre });
  }

  const conContacto = (c, h, pend, item) => (c.dueno === "agente" ? delAgente(c, h, pend, item) : deCande(c, item));

  /**
   * Alguien que la base no reconoce por su Instagram. Si en ManyChat es un contacto que la base ya tiene (todavía
   * sin su usuario o su id de Instagram), queda guardado y sigue como cualquier charla de su dueño. Si no, entra
   * como alta, salvo que Cande le haya escrito a mano (no se toma) o que el agente no pueda tomarlo (apagado, altas
   * apagadas, tope, no se sabe quién es en ManyChat): esas van al resumen, nunca quedan calladas.
   */
  async function sinContacto(h, pend, item) {
    if (aj.seguidos === true && item.usuario && (await base.loSigue(item.usuario))) return;
    const q = await quienEs(h.otro);
    if (q.laSigue || q.despues) return;
    if (q.id) {
      const c = await base.contacto(q.id);
      if (c) {
        // Sus reglas de siempre miran el "--" desde que la charla es de quien es (delAgente).
        await base.guardarIg(c.id, { igId: h.otro.id, usuario: item.usuario || null });
        await conContacto({ ...c, ig_id: h.otro.id }, h, pend, item);
        return;
      }
    }
    if (hayCodigo(h, yo)) return; // Cande escribió "--" a alguien que el agente nunca tuvo: es de ella
    const nombre = q.nombre || null;
    const vieja = item.edad >= VENTANA_AGENTE_MS;
    if (aManoSinContacto(h, yo, [...automaticos, ...clavesDeOtras(lista, yo, h.id)])) {
      items.push({ ...item, seccion: vieja ? "mano" : "vos", nombre, nota: "hay mensajes tuyos a mano: el agente no se metió" });
      return;
    }
    if (vieja) {
      items.push({ ...item, seccion: "mano", nombre, nota: "nunca le llegó al agente" });
      return;
    }
    let motivo = q.motivo;
    if (q.id) {
      if (!prendido) motivo = "el agente está apagado";
      else if (aj.altas !== true) motivo = "las altas están apagadas";
      else {
        const guardados = await base.darDeAltaDesdeBandeja(q.id, {
          nombre, mensajes: pend.map(paraGuardar), contexto: aj.contexto_alta, tope: aj.altas_por_dia, igId: h.otro.id, usuario: item.usuario || null,
        });
        if (guardados) {
          r.altas++;
          return;
        }
        if (await base.contacto(q.id)) return; // entró recién por la entrada: la ve la vuelta siguiente
        motivo = "se llenó el tope de altas del día";
      }
    }
    items.push({ ...item, seccion: "vos", nombre, nota: `nueva, no entró al agente: ${motivo}` });
  }

  for (const h0 of lista) {
    if (reloj() >= hasta) break;
    if (h0.actualizado && t0 - h0.actualizado > MIRAR_HASTA_MS) break; // vienen de la más nueva a la más vieja
    r.miradas++;
    // Primero quién escribió lo último (un pedido como mucho); la charla entera, solo si fue el lead.
    const h1 = await ig.completo(h0, 1);
    const ultimo1 = sinRespuesta(h1, yo).at(-1);
    if (!ultimo1?.creado || t0 - ultimo1.creado < GRACIA_MS || t0 - ultimo1.creado > MIRAR_HASTA_MS) continue;
    const h = await ig.completo(h0);
    const pend = sinRespuesta(h, yo);
    const ultimo = pend.at(-1);
    if (!h.otro?.id || !ultimo?.creado) continue;
    const item = { hilo: h.id, mid: ultimo.id, usuario: h.otro.usuario || "", edad: t0 - ultimo.creado, texto: textoDe(ultimo) };
    try {
      let c = await base.contactoDeIg({ igId: h.otro.id, usuario: h.otro.usuario });
      if (c && c.ig_id && c.ig_id !== h.otro.id) c = null; // otra persona con ese usuario
      if (c && !c.ig_id) await base.guardarIg(c.id, { igId: h.otro.id });
      if (c) await conContacto(c, h, pend, item);
      else await sinContacto(h, pend, item);
    } catch (e) {
      registrar(e); // una charla que falla no frena a las demás
    }
  }

  if (idsCambiaron) {
    try {
      await base.guardarConfig("bandeja_ids", ids);
    } catch (e) {
      registrar(e); // se vuelve a buscar en la vuelta siguiente
    }
  }

  const res = armarResumen(items, { ahora: t0, estado: await base.leerConfig("bandeja_resumen") });
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
    }
  }
  return r;
}
