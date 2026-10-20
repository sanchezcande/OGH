// El agente de DM: qué pasa con cada mensaje que entra.
//
//   1. Espera unos segundos y junta la ráfaga (3 de cada 10 turnos llegan en varios mensajes).
//   2. Toma la traba del contacto: una sola corrida por charla a la vez.
//   3. Le pide la respuesta al modelo, con toda la charla.
//   4. Pasa la respuesta por los frenos (lib/dm/frenos.js).
//   5. Vuelve a mirar que siga prendido y que la charla siga siendo suya, deja constancia y
//      recién ahí manda, deja un borrador, calla o le pasa la charla a Cande.
//
// Si algo falla, al lead no le llega nada. Si es el modelo el que no dio respuesta (la Mac apagada,
// dormida o sin uso), la charla queda en espera: sigue del agente, sin aviso, y la contesta el cron
// de la espera cuando el modelo vuelve (lib/dm/seguimientos.js). Cualquier otra falla le pasa la
// charla a Cande con aviso.
//
// Una foto (o un archivo) del lead: casi siempre es el comprobante de quien pagó en pesos. Con la Mac
// contestando, el agente la mira (19/10, Cande: "o podés chequear vos y pasarles el código"): el modelo dice
// si es un comprobante de MercadoPago aprobado, al lead le manda solo un acuse, y a Cande le llega un aviso
// YA con la foto y el borrador del código, que sale cuando ella responde ok (avisarPago y
// lib/dm/respuestas.js). Ese aviso sale después de dejar lista la respuesta al lead (ver procesarTurno).
// El código no lo escribe nunca el agente, tampoco siguiendo una indicación de Cande: frenoDelCodigo
// (lib/dm/frenos.js) mira todo lo que el agente le manda al lead (respuesta, indicación, toque, respuesta
// tarde) antes que cualquier otro freno. Solo lo llevan el borrador que ella aprueba con ok y su /textual.
// Sin la Mac, o si el agente no la pudo ver, a Cande le llega enseguida el aviso URGENTE de siempre con el
// link de la charla, y si en el turno no hay nada más, el agente no le escribe nada. Una foto queda resuelta
// solo cuando sale su aviso (o el aviso del pago con ella): si no salió, queda sin constancia y la reintenta
// el cron de los toques, sea de quien sea la charla (ver avisarFotos). El aviso YA del código también: queda
// guardado con su borrador y, si no salió, lo reintenta el cron de los toques (avisarCodigosPendientes).
//
// Las dependencias (base, modelo, ManyChat, aviso) entran por parámetro para poder probarlo con
// dobles, sin base ni red.
import { randomUUID } from "node:crypto";
import {
  MAX_TOQUES, avisaQueEsAutomatico, frenoDelCodigo, normalizar, proximoToque, revisar, sinSeguimiento, tieneCodigo, ventanaAbierta,
} from "./frenos";
import { firmarIg } from "./firmaIg";
import { claveTexto, linkCharlaIg, usuarioParaAviso } from "./instagram";
import { NOTA_FORMULARIO, conIdDeCharla, esNotaDeFormulario } from "./linkFormulario";
import { MARCA_OK, TITULOS_CODIGO, TITULOS_FOTO, esCodigoSalir } from "./respuestas";
import { FALLA_DUDOSA, FALLA_GENERAL, FALLA_PROPIA } from "./seguimientos";

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const corto = (s, n = 280) => (String(s || "").length > n ? String(s).slice(0, n) + "…" : String(s || ""));
// El modelo empieza su aviso con "YA:" o con "HOY:" cuando la charla no puede esperar a la lista del día.
const esUrgente = (aviso) => /^(YA|HOY):/.test(aviso || "");

/** Lo que guarda la entrada cuando ManyChat no trae texto: una foto, un audio, un sticker. */
export const SIN_TEXTO = "[adjunto o mensaje sin texto]";

/**
 * Si el mensaje del lead es una foto (o un archivo) que el agente no puede ver: sin texto, lo que
 * guarda la entrada en ese caso, o solo el link al archivo en los servidores de Meta (así lo manda
 * ManyChat: lookaside.fbsbx.com/ig_messaging_cdn/?asset_id=...). Un link común (github, linkedin, un
 * sitio, un reel de instagram.com) no es una foto: es algo que el lead escribió.
 */
export function esFoto(texto) {
  const t = String(texto ?? "").trim();
  if (!t || /^\[adjunto( o mensaje sin texto)?\]$/i.test(t)) return true;
  return urlDeFoto(t) !== null;
}

/**
 * Si el mensaje del lead es un adjunto: lo que la red de la bandeja (lib/dm/bandeja.js) guarda sin texto (una foto,
 * un audio, un reel o una publicación compartidos: Instagram los da sin texto) y lo que trae ManyChat de eso: nada,
 * el link al archivo en los servidores de Meta (esFoto) o, de un reel o una publicación compartidos, solo su link de
 * instagram.com. Un link de Instagram con algo escrito al lado es un texto.
 */
export function esAdjunto(texto) {
  if (esFoto(texto)) return true;
  const t = String(texto ?? "").trim();
  if (/\s/.test(t)) return false;
  let u;
  try {
    u = new URL(t);
  } catch {
    return false;
  }
  const h = u.hostname.toLowerCase();
  return (h === "instagram.com" || h.endsWith(".instagram.com") || h === "instagr.am") && /^\/(reels?|p|tv|stories|share)\//i.test(u.pathname);
}

/** Si dos textos dicen lo mismo: iguales, o iguales sin tildes, mayúsculas ni signos (ManyChat e Instagram no siempre lo dan igual). */
export function mismoTexto(a, b) {
  const x = String(a ?? "").trim();
  const y = String(b ?? "").trim();
  if (x === y) return true;
  const kx = claveTexto(x);
  return Boolean(kx) && kx === claveTexto(y);
}

/**
 * Si dos textos pueden ser el mismo mensaje del lead: mismoTexto, o dos adjuntos (una foto con su link y la misma
 * sin texto, un reel con su link y el mismo sin texto). Dos adjuntos cualesquiera no son el mismo mensaje: esto vale
 * solo con la hora al lado (la red de la bandeja empareja así lo que entró por la entrada minutos antes o después).
 */
export function mismoMensaje(a, b) {
  return mismoTexto(a, b) || (esAdjunto(a) && esAdjunto(b));
}

/**
 * El eco de un adjunto que guardó la red llega por el webhook a lo sumo esto después de que el lead lo mandó (la
 * hora de Instagram). Más tarde es otro adjunto: la foto del comprobante que manda después tiene que entrar.
 */
export const ECO_ADJUNTO_MS = 15 * 60000;

/** El link a un archivo en los servidores de Meta (https, sin espacios), o null si el texto no es eso. */
export function urlDeFoto(texto) {
  const t = String(texto ?? "").trim();
  if (!t || /\s/.test(t)) return null;
  let u;
  try {
    u = new URL(t);
  } catch {
    return null;
  }
  const h = u.hostname.toLowerCase();
  return u.protocol === "https:" && ["fbsbx.com", "fbcdn.net", "cdninstagram.com"].some((d) => h === d || h.endsWith(`.${d}`)) ? t : null;
}

const HORA = 3600000;
// El borrador del código vale una semana (como en base.tomarBorradorCodigo): después se arma otro.
const VIGENCIA_BORRADOR_MS = 7 * 24 * HORA;
// Varias fotos seguidas (las dos caras de un comprobante): un solo aviso URGENTE. Tiene que coincidir con el
// intervalo de base.reclamarAvisoFoto y base.fotosSinAviso.
const FOTOS_JUNTAS_MS = 2 * 60000;
// Si otra corrida tiene la charla, la del mensaje nuevo la espera: 40 vueltas de 3 segundos son
// los 2 minutos que puede tardar la otra como mucho (dos intentos del modelo y el envío).
const ESPERA_DE_TRABA_MS = 3000;
const VUELTAS_DE_TRABA = 40;
// Un toque no sale si el lead escribió hace menos que esto: el más corto se agenda a las 4 horas.
const MINIMO_ANTES_DE_UN_TOQUE = 3.5 * HORA;
const ENTRE_TOQUES = 4 * HORA;

/** Lo que el modelo recibe cuando Cande le dice desde Telegram qué contestar. */
export const notaIndicacion = (texto) =>
  `INDICACIÓN DE CANDE (te habla a vos, no al lead): «${String(texto).slice(0, 1000)}». Escribí el próximo mensaje para ` +
  "el lead siguiendo lo que ella pide, con su voz y en el punto de la charla en que están. Si lo que escribió ya es un " +
  "mensaje para el lead, mandalo casi igual. Nunca le copies la indicación ni le digas que alguien te pidió algo.";

/**
 * Con una indicación de Cande solo se frena lo que no puede salir nunca: un mensaje de más del tope o pedir datos de
 * pago. El código de acceso tampoco sale, pero eso lo mira frenoDelCodigo antes que esto (procesarTurno).
 */
function revisarIndicacion(salida) {
  if (salida.accion === "responder" && !salida.mensajes.length) return { ok: false, motivo: "respuesta vacía" };
  if (salida.mensajes.some((m) => m.length > 1000)) return { ok: false, motivo: "mensaje demasiado largo" };
  if (salida.mensajes.some(esCodigoSalir)) return { ok: false, motivo: "mensaje que es el código para sacar al agente" };
  // Que no le llegue la indicación copiada: palabras de quien le habla al agente, no al lead.
  if (salida.mensajes.some((m) => /\b(decile|decirle|decirles|contestale|preguntale|mandale|respondele|a est[ea] (decile|decirle|contestale|preguntale|mandale)|el lead|los leads|el agente|indicaci[oó]n|prompt)\b/i.test(m))) {
    return { ok: false, motivo: "parecía la indicación copiada" };
  }
  if (salida.mensajes.some((m) => /\b(cvv|cvc|cbu|cvu|n[uú]mero de (la |tu )?tarjeta|comprobante)\b/i.test(m))) {
    return { ok: false, motivo: "pide datos de pago por chat" };
  }
  return { ok: true };
}
const HISTORIAL_PARA_EL_MODELO = 80;
const HISTORIAL_PARA_LOS_FRENOS = 1000;

/**
 * El turno tal como lo espera el prompt: contexto, historial y los mensajes nuevos del lead.
 *
 * Nuevo es todo mensaje del lead posterior al último que se atendió (`desde`), esté donde esté:
 * si uno entró mientras salía la respuesta anterior, queda antes de esa respuesta en el orden,
 * y deducir el turno del orden lo perdería. En un seguimiento no hay mensajes nuevos.
 */
export function armarTurno(mensajes, {
  evento = null, ahora = new Date(), ultimoLead = null, toque = 0, desde = 0, contexto = null,
} = {}) {
  const esNuevo = (m) => !evento && m.quien === "lead" && m.id > desde;
  const horas = ultimoLead ? Math.round(((ahora - ultimoLead) / HORA) * 10) / 10 : null;
  const seguimiento = evento === "seguimiento"
    ? `SEGUIMIENTO: el lead no contesta hace ${horas} horas. Este es el toque ${toque + 1} de ${MAX_TOQUES}. ` +
      "Escribí solo el mensaje de seguimiento que corresponde a esta charla, o callá si no corresponde ninguno."
    : null;
  return {
    contexto: [seguimiento, contexto].filter(Boolean).join(" ") || null,
    historial: mensajes.filter((m) => !esNuevo(m)).map((m) => ({
      quien: m.quien === "agente" ? "cande" : m.quien, texto: m.texto,
    })),
    mensajes_del_lead: mensajes.filter(esNuevo).map((m) => m.texto),
  };
}

/** Lo último que dijo el lead de corrido, haya o no una respuesta después. */
function ultimoTurnoDelLead(mensajes) {
  let fin = mensajes.length;
  while (fin > 0 && mensajes[fin - 1].quien !== "lead") fin--;
  let inicio = fin;
  while (inicio > 0 && mensajes[inicio - 1].quien === "lead") inicio--;
  return mensajes.slice(inicio, fin).map((m) => m.texto);
}

// Lo que puede tardar la mirada a Instagram en cada turno: si tarda más, el agente sigue sin ella.
const ESPERA_INSTAGRAM_MS = 15000;

/**
 * Las fotos (o archivos) del lead de esta lista que todavía no tienen su aviso: posteriores a la constancia
 * (foto_avisada_hasta) y que no van con el último URGENTE (foto_avisada_en: las que llegaron 2 minutos antes o
 * después; el aviso del pago no junta ninguna, ver base.reclamarAvisoFoto).
 * `soloAntes`: con la Mac contestando, el URGENTE junta solo las que llegaron hasta que salió. Las de después
 * las mira el agente: el lead pudo mandar la buena después de leer la respuesta a la primera (19/10).
 */
function fotosSinSuAviso(mensajes, c, { soloAntes = false } = {}) {
  const hasta = Number(c?.foto_avisada_hasta) || 0;
  const avisoEn = c?.foto_avisada_en ? new Date(c.foto_avisada_en).getTime() : null;
  const conEseAviso = (m) => {
    if (avisoEn === null || !m.creado) return false;
    const despues = new Date(m.creado).getTime() - avisoEn; // negativo: llegó antes del aviso
    return despues > -FOTOS_JUNTAS_MS && (soloAntes ? despues <= 0 : despues < FOTOS_JUNTAS_MS);
  };
  return mensajes.filter((m) => m.quien === "lead" && m.id > hasta && esFoto(m.texto) && !conEseAviso(m));
}

/**
 * Lo que el modelo dice del pago en pesos, si vale (o null). Un comprobante o una foto dudosa sin haber visto todas
 * las fotos del turno no valen (un cerebro de antes no las mira).
 */
function pagoQueVale(salida, { imagenes, vistas }) {
  const vio = imagenes.length > 0 && vistas >= imagenes.length;
  return (salida.pago_pesos === "comprobante" || salida.pago_pesos === "dudoso") && !vio ? null : salida.pago_pesos;
}

export function crearAgente({
  base, pedir, manychat, avisar, esperar = dormir, reloj = () => new Date(), instagram = null, esperaInstagramMs = ESPERA_INSTAGRAM_MS,
  // Si el agente puede mirar las fotos del lead (la Mac contesta: armado.veFotos). Sin eso, van a Cande como siempre.
  veFotos = async () => false,
}) {
  // Prendido es solo "auto" o "sombra". Cualquier otra cosa guardada en el modo es apagado.
  const prendido = (aj) => aj.modo === "auto" || aj.modo === "sombra";

  /**
   * Si Cande sigue a la persona o escribió "--" en el chat desde Instagram, por qué (o null).
   * `instagram` son las reglas de lib/dm/instagram.js: solo con el token y el ajuste prendido.
   * Nunca frena al agente por una falla: si Instagram no contesta a tiempo, sigue como siempre.
   */
  const miraInstagram = (aj) => Boolean(instagram) && (aj.seguidos === true || (aj.instagram === true && instagram.conApi !== false));
  async function deCandePorInstagram(aj, c) {
    if (!miraInstagram(aj)) return null;
    let t;
    try {
      return await Promise.race([
        instagram.porQueSale(c, { lista: aj.seguidos === true, api: aj.instagram === true }),
        new Promise((r) => { t = setTimeout(() => r(null), esperaInstagramMs); }),
      ]);
    } catch {
      return null;
    } finally {
      clearTimeout(t);
    }
  }
  const quienEs = (c) => `${String(c.nombre || "sin nombre").replace(/\s+/g, " ")} (${c.id})`; // un solo renglón (ver lib/dm/respuestas.js)

  /** Le avisa a Cande y devuelve si el aviso salió. Si no sale (Telegram caído, lento o sin configurar), queda anotado. */
  async function avisarACande(c, titulo, campos, opciones = {}) {
    let salio = false;
    // El nombre adelante: en Telegram la cita de una respuesta muestra solo el principio del aviso, y
    // así se ve a quién se le está contestando (16/10: los avisos se veían todos iguales).
    const conNombre = c?.nombre ? `${Array.from(String(c.nombre).replace(/\s+/g, " ")).slice(0, 40).join("")} · ${titulo}` : titulo;
    // El aviso de una charla trae el link que la abre en Instagram (18/10: "que me abra ig en esa conversación").
    const link = campos?.Quién ? linkCharlaIg(await usuarioParaAviso(c, { base, manychat })) : null;
    try {
      salio = await avisar(conNombre, link ? { ...campos, Instagram: link } : campos, opciones);
    } catch {
      salio = false;
    }
    if (salio) return true;
    try {
      await base.guardarSalida({
        contacto: c.id, accion: "aviso", estado: "aviso_fallido",
        detalle: corto(`${titulo}: ${campos.Aviso || campos["Aviso del agente"] || ""}`, 400),
      });
    } catch {
      // sin base tampoco hay dónde anotarlo
    }
    return false;
  }

  /**
   * La charla pasa a ser de Cande y se le avisa. Cada paso va por separado: que falle uno no
   * frena los otros, y lo que no se pudo hacer se lo dice el mismo aviso.
   */
  async function pasarACande(c, { aviso, avisoModelo = "", motivo, ultimo = "", enviado = "" }) {
    const ojo = [];
    try {
      await base.ponerDueno(c.id, "cande");
    } catch {
      ojo.push("no pude cambiar el dueño en la base: sigue figurando del agente");
    }
    let campo = { ok: false };
    try {
      campo = await manychat.ponerCampo(c.id, "dm_dueno", "cande"); // una Regla de ManyChat pausa sus automáticos
    } catch {
      campo = { ok: false };
    }
    if (!campo.ok) ojo.push("no pude pausar los automáticos en ManyChat");
    await avisarACande(c, `DM${esUrgente(avisoModelo || aviso) ? " URGENTE" : ""}: te paso una charla`, {
      Quién: quienEs(c), "Lo último que dijo": corto(ultimo), "El agente le mandó": corto(enviado),
      Aviso: aviso, "Aviso del agente": avisoModelo, Motivo: motivo, Ojo: ojo.join("; "),
    });
  }

  /**
   * Las fotos (o archivos) del lead que todavía no tienen su aviso: a Cande le llega ya un aviso URGENTE con
   * el link de la charla. El agente no las puede ver, y casi siempre es el comprobante de quien pagó en
   * pesos por MercadoPago (la página del video les pide mandarlo por acá). 19/10, Cande: "cuando recibamos
   * foto así enseguida me lo pases como URGENTE al chat con el link también porfi así les doy el código".
   *
   * Un aviso por foto, con constancia en la base (foto_avisada_hasta): se aparta antes de mandar, así dos
   * corridas a la vez (ManyChat que reintenta, la espera, el cron) no avisan la misma; si el aviso no sale,
   * la constancia se devuelve y la foto vuelve a quedar sin aviso: la reintenta el turno de la foto o el
   * cron de los toques (avisarFotosPendientes), que corre con la Mac apagada también. Las fotos que llegan
   * hasta 2 minutos antes o después de un aviso de esta charla van con ese (las dos caras de un
   * comprobante, o ManyChat que reintenta el mismo mensaje).
   * Devuelve { salio, faltan }: si salió un aviso y cuántas fotos siguen sin el suyo. Nunca tira: es un aviso.
   * Si alguna foto vino con su link, el aviso la trae (sendPhoto, lib/notificar.js).
   * Una foto queda resuelta solo cuando sale su aviso. `cualquierDueno`: el turno de la foto, el final de su
   * corrida y el cron la avisan aunque la charla ya sea de Cande: en ese turno pudo pasar a ella (el tope del día,
   * un freno, el modelo) con Telegram caído, y la foto llegó cuando era del agente. Sin eso (la entrada), en una
   * charla de Cande no se avisa: el agente no está ahí.
   * `limite`: solo las fotos hasta ese mensaje (las de un turno; las que llegan después son de otra corrida).
   */
  async function avisarFotos(id, { cualquierDueno = false, limite = Infinity } = {}) {
    let fotos = [];
    try {
      const recientes = (await base.historial(id, 30)).filter((m) => m.id <= limite);
      if (!recientes.some((m) => m.quien === "lead" && esFoto(m.texto))) return { salio: false, faltan: 0 };
      const c = await base.contacto(id);
      if (!c || (c.dueno !== "agente" && !cualquierDueno)) return { salio: false, faltan: 0 };
      const hasta = Number(c.foto_avisada_hasta) || 0;
      fotos = recientes.filter((m) => m.quien === "lead" && m.id > hasta && esFoto(m.texto));
      if (!fotosSinSuAviso(fotos, c).length) return { salio: false, faltan: 0 };
      const ultima = fotos.at(-1).id;
      const link = fotos.map((m) => urlDeFoto(m.texto)).filter(Boolean).at(-1);
      // La constancia antes de mandar. Si no se aparta, otra corrida lo está mandando (o ya salió).
      const antes = await base.reclamarAvisoFoto(id, ultima);
      if (!antes) return { salio: false, faltan: 0 };
      let salio = false;
      try {
        salio = await avisarACande(c, TITULOS_FOTO.urgente, {
          Quién: quienEs(c),
          "Lo último que escribió": corto(recientes.filter((m) => m.quien === "lead" && m.id < ultima && !esFoto(m.texto)).at(-1)?.texto) || "(nada en texto)",
          Aviso: "Mandó una foto: si es el comprobante de MercadoPago, pasale el código",
        }, link ? { foto: link } : {});
      } finally {
        // Si esto falla también (la base caída justo ahora), la foto queda como avisada sin aviso: hacen
        // falta dos fallas a la vez. Al revés (constancia después de mandar) saldrían avisos repetidos.
        if (!salio) await base.soltarAvisoFoto(id, ultima, antes);
      }
      return { salio, faltan: salio ? 0 : fotos.length };
    } catch {
      // No se sabe si quedó alguna sin aviso: se da por que sí (el turno de la foto no se cierra).
      return { salio: false, faltan: Math.max(1, fotos.length) };
    }
  }

  /**
   * El cron de los toques: las charlas con una foto que se quedó sin su aviso (base.fotosSinAviso: el aviso
   * no salió, o la corrida se cortó antes de mandarlo), también las que en ese turno pasaron a Cande. Corre
   * siempre, esté la Mac o no. Pasada la hora `hasta` no arranca otro aviso: quedan para la vuelta siguiente.
   * Devuelve cuántos avisos salieron.
   */
  async function avisarFotosPendientes(ids, { hasta = Infinity, ahora = () => Date.now() } = {}) {
    let salieron = 0;
    for (const id of ids) {
      if (ahora() >= hasta) break;
      if ((await avisarFotos(id, { cualquierDueno: true })).salio) salieron++;
    }
    return salieron;
  }

  /**
   * Si en lo último de la charla hay fotos del lead que tiene que mirar el agente (la Mac contesta): sin su
   * aviso, o posteriores al último URGENTE. En una charla de Cande no (como en la entrada sin la Mac: el agente no
   * está ahí). Si no se puede saber, sí: que alguien las mire.
   */
  async function hayFotosSinAviso(id) {
    try {
      const recientes = await base.historial(id, 30);
      if (!recientes.some((m) => m.quien === "lead" && esFoto(m.texto))) return false;
      const c = await base.contacto(id);
      return Boolean(c) && c.dueno === "agente" && fotosSinSuAviso(recientes, c, { soloAntes: true }).length > 0;
    } catch {
      return true;
    }
  }

  /**
   * Los links de estas fotos del lead, en orden, para que las mire el agente: el que mandó ManyChat como texto
   * o, si llegó sin link ("[adjunto...]"), el que da Instagram (instagram.imagenesDelLead). Si falta el de
   * alguna, ninguno: las fotos van a Cande como siempre. Instagram tiene el mismo tope de espera que su mirada.
   */
  async function linksDeFotos(c, lista) {
    const directos = lista.map((m) => urlDeFoto(m.texto));
    const faltan = directos.filter((u) => !u).length;
    if (!faltan) return directos;
    if (!instagram?.imagenesDelLead) return [];
    let t;
    let deIg = [];
    try {
      deIg = await Promise.race([
        instagram.imagenesDelLead(c, { cuantas: faltan, desde: lista.find((m) => !urlDeFoto(m.texto))?.creado || null }),
        new Promise((r) => { t = setTimeout(() => r([]), esperaInstagramMs); }),
      ]);
    } catch {
      deIg = [];
    } finally {
      clearTimeout(t);
    }
    const validos = (Array.isArray(deIg) ? deIg : []).map(urlDeFoto).filter(Boolean);
    if (validos.length < faltan) return [];
    let i = validos.length - faltan;
    return directos.map((u) => u || validos[i++]);
  }

  /**
   * El mensaje con el código para quien pagó en pesos: { texto, previo, nota }. Sale de la plantilla de los
   * ajustes (mensaje_codigo_mp: {codigo} y {link} se completan con el código y el link de pago con el código),
   * que carga Cande en la base: el texto no vive en este repo. Un solo código por lead: si ya le salió (en la
   * charla o por un ok anterior) no se arma otro, y si hay uno esperando su ok, es ese (previo: su id). Lo guarda
   * avisarPago, con su aviso. Nunca tira: lo que no se pudo, lo dice la nota del aviso.
   */
  async function borradorDelCodigo(c, { todos, aj }) {
    try {
      const codigo = aj.codigo_mercadopago || "";
      if (codigo && todos.some((m) => (m.quien === "agente" || m.quien === "cande") && tieneCodigo(m.texto, codigo))) {
        return { nota: "el código ya le salió antes en la charla: no armé otro borrador" };
      }
      const previo = await base.codigoDe(c.id);
      if (previo && previo.estado !== "borrador") {
        return { nota: "el código ya le salió antes (o no se sabe si le llegó): no armé otro borrador" };
      }
      if (previo && reloj() - new Date(previo.creado) < VIGENCIA_BORRADOR_MS) {
        return { texto: (previo.mensajes || []).join("\n"), previo: previo.id, nota: "ya había un borrador esperando tu ok: es este" };
      }
      const plantilla = aj.mensaje_codigo_mp || "";
      const link = codigo && aj.link_de_pago ? `${aj.link_de_pago.replace(/\/+$/, "")}/${codigo}` : "";
      const falta = new Set([
        !plantilla && "mensaje_codigo_mp",
        (plantilla.includes("{codigo}") || plantilla.includes("{link}")) && !codigo && "codigo_mercadopago",
        plantilla.includes("{link}") && !aj.link_de_pago && "link_de_pago",
      ].filter(Boolean));
      if (falta.size) return { nota: `no armé el borrador del código: falta cargar ${[...falta].join(" y ")} en los ajustes. Contestale vos` };
      return { texto: plantilla.replaceAll("{codigo}", codigo).replaceAll("{link}", link).trim() };
    } catch (e) {
      return { nota: `no pude armar el borrador del código (${corto(e.message, 120)}): contestale vos` };
    }
  }

  /**
   * El aviso del pago en pesos (19/10): YA, con la foto si la hay, lo que vio el agente y el borrador del
   * código; Cande responde ok y el bot se lo manda (lib/dm/respuestas.js). "dudoso" (una foto que no se pudo
   * confirmar como pago) va sin borrador: ella contesta lo que quiera. Si trae las fotos, deja su constancia
   * (solo de las que vio: las que lleguen después las mira el agente o van con el URGENTE).
   *
   * Va en dos partes. prepararPago, antes de la respuesta al lead: arma el aviso y guarda el borrador con él
   * (constancia antes de mandar: si el aviso no llega a salir, aunque la corrida se corte, el cron de los toques
   * lo reintenta con la foto, avisarCodigosPendientes, y el acuse que le promete el código al lead no queda
   * colgado). avisarPago, con la respuesta ya lista: lo manda. Sin borrador, si no sale, la constancia de las
   * fotos se devuelve y las avisa el cron como siempre.
   */
  async function prepararPago(c, { pago, salida, dijo, todos, aj, fotos = [], ultimaFoto = null }) {
    const cod = pago === "dudoso" ? {} : await borradorDelCodigo(c, { todos, aj });
    const porQue = String(salida.aviso_para_cande || "").replace(/^(YA|HOY):\s*/, "").trim() || salida.motivo || "";
    const que = {
      comprobante: "vi el comprobante de MercadoPago aprobado: fijate que te haya llegado la plata",
      dice: "dice que ya pagó en pesos (MercadoPago, sin foto): fijate que te haya llegado la plata",
      dudoso: "mandó una foto que no pude confirmar como pago",
    }[pago];
    const titulo = TITULOS_CODIGO[pago] || TITULOS_FOTO.dudoso;
    const opciones = fotos.length ? { foto: fotos[0] } : {};
    const armar = (borrador, nota) => ({
      Quién: quienEs(c),
      Dijo: corto(dijo) || "(nada en texto)",
      Aviso: `YA: ${que.charAt(0).toUpperCase()}${que.slice(1)}${porQue ? `. ${corto(porQue, 300)}` : ""}`,
      Borrador: borrador || undefined,
      "Si está bien": borrador ? MARCA_OK : undefined,
      Ojo: nota ? `${nota.charAt(0).toUpperCase()}${nota.slice(1)}` : undefined,
      "Más fotos": fotos.length > 1 ? fotos.slice(1).join("\n") : undefined,
    });
    let borrador = cod.texto || null;
    let nota = cod.nota || "";
    let idBorrador = null;
    if (borrador) {
      const aviso = { titulo, campos: armar(borrador, nota), ...opciones };
      try {
        if (cod.previo) {
          await base.marcarAvisoCodigo(cod.previo, { aviso });
          idBorrador = cod.previo;
        } else {
          idBorrador = await base.guardarBorradorCodigo({ contacto: c.id, mensajes: [borrador], motivo: `pago en pesos: ${pago}`, aviso });
        }
      } catch (e) {
        // Uno que ya estaba guardado sigue sirviendo para el ok (sin reintento del aviso); uno nuevo, no.
        if (!cod.previo) {
          borrador = null;
          nota = `no pude guardar el borrador del código (${corto(e.message, 120)}): contestale vos`;
        }
      }
    }
    return { titulo, campos: armar(borrador, nota), opciones, idBorrador, ultimaFoto };
  }

  /** La segunda parte: manda el aviso que armó prepararPago y deja la constancia de las fotos. Devuelve si salió. */
  async function avisarPago(c, { titulo, campos, opciones, idBorrador, ultimaFoto }) {
    let antes = null;
    if (ultimaFoto) {
      try {
        antes = await base.reclamarAvisoFoto(c.id, ultimaFoto, { soloVistas: true });
      } catch {
        antes = null;
      }
    }
    let salio = false;
    try {
      salio = await avisarACande(c, titulo, campos, opciones);
    } finally {
      try {
        if (salio && idBorrador) await base.marcarAvisoCodigo(idBorrador, { salio: true });
        // Con el borrador guardado la foto va en el reintento de su aviso: la constancia queda.
        if (!salio && antes && !idBorrador) await base.soltarAvisoFoto(c.id, ultimaFoto, antes);
      } catch {
        // sin base: si salió, el cron lo puede repetir (el ok manda una sola vez); si no, la foto queda como
        // avisada sin aviso: hacen falta dos fallas a la vez (como en avisarFotos)
      }
    }
    return salio;
  }

  /**
   * El cron de los toques: los avisos YA del código que no salieron (base.codigosSinAviso). Sale el mismo aviso
   * que se guardó con el borrador, con la foto, y una línea que dice que llega tarde. Pasada la hora `hasta` no
   * arranca otro (como los demás pasos del cron): quedan para la vuelta siguiente. Devuelve cuántos salieron.
   */
  async function avisarCodigosPendientes(filas, { hasta = Infinity, ahora = () => Date.now() } = {}) {
    let salieron = 0;
    for (const f of filas) {
      if (ahora() >= hasta) break;
      try {
        const c = await base.contacto(f.contacto);
        if (!c) continue;
        let guardado = null;
        try {
          guardado = JSON.parse(f.aviso || "null");
        } catch {
          guardado = null;
        }
        // Sin el aviso guardado (no debería pasar), uno con lo justo para el ok.
        const pago = /comprobante/.test(f.motivo || "") ? "comprobante" : "dice";
        const campos = guardado?.campos?.Quién ? guardado.campos : {
          Quién: quienEs(c), Borrador: (f.mensajes || []).join("\n"), "Si está bien": MARCA_OK,
        };
        const salio = await avisarACande(c, guardado?.titulo || TITULOS_CODIGO[pago], {
          ...campos,
          Demora: "este aviso no había salido (Telegram no andaba). Si ya le pasaste el código, no respondas ok",
        }, guardado?.foto ? { foto: guardado.foto } : {});
        if (!salio) continue;
        salieron++;
        await base.marcarAvisoCodigo(f.id, { salio: true });
      } catch {
        // lo intenta la vuelta siguiente
      }
    }
    return salieron;
  }

  /**
   * Lo que vio el agente en un turno del lead: si dijo que es un pago en pesos, el aviso con el borrador
   * (avisarPago); las fotos que no cubre ese aviso (no las pudo ver, o no eran un pago), el URGENTE de siempre.
   * Un comprobante o una foto dudosa sin haber visto las fotos no valen (pagoQueVale).
   * Prepara lo que va antes de la respuesta (el borrador guardado, prepararPago) y devuelve la función que manda
   * los avisos, que procesarTurno corre con la respuesta ya lista. Esa devuelve { faltan }: cuántas fotos siguen
   * sin su aviso (Telegram no anduvo; las reintenta el cron).
   */
  async function prepararLoQueVio(c, { salida, imagenes, vistas, fotosVistas, dijo, todos, aj }) {
    const vio = imagenes.length > 0 && vistas >= imagenes.length;
    const pago = pagoQueVale(salida, { imagenes, vistas });
    const listo = pago ? await prepararPago(c, {
      pago, salida, dijo, todos, aj, fotos: vio ? imagenes : [], ultimaFoto: vio ? fotosVistas.at(-1).id : null,
    }) : null;
    return async () => {
      const cubiertas = listo ? (await avisarPago(c, listo)) && vio : false;
      if (imagenes.length && !cubiertas) return avisarFotos(c.id, { cualquierDueno: true });
      return { faltan: 0 };
    };
  }

  /**
   * Las charlas que esperaron más de lo que deja Instagram (base.sinVentana: la Mac apagada casi un día):
   * el agente ya no les puede escribir. Le llegan a Cande en UN aviso, con el nombre y el link de cada
   * una, y a cada una se le cierra el turno con una nota en la charla: ninguna se pierde callada y
   * ninguna se avisa dos veces. Si el aviso no sale, no se cierra nada: lo intenta la vuelta siguiente.
   * Pasada la hora `hasta`, el link sale solo si el usuario de Instagram ya estaba guardado (preguntarle
   * a ManyChat tarda). Devuelve cuántas cerró.
   */
  async function avisarSinVentana(filas, { hasta = Infinity, ahora = () => Date.now() } = {}) {
    if (!filas.length) return 0;
    const renglones = [];
    for (const c of filas) {
      const usuario = ahora() < hasta ? await usuarioParaAviso(c, { base, manychat }) : c.ig_usuario || null;
      const nombre = Array.from(String(c.nombre || "sin nombre").replace(/\s+/g, " ")).slice(0, 40).join("");
      renglones.push(`${nombre}: ${linkCharlaIg(usuario) || "sin link (no sé su usuario de Instagram)"}`);
    }
    let salio = false;
    try {
      salio = await avisar("DM: charlas que el agente no llegó a contestar", {
        Aviso: "esperaron más de 23 horas (la Mac apagada o sin su Claude) e Instagram ya no deja que el agente les escriba: si querés, escribiles vos desde la app",
        Charlas: `\n${renglones.join("\n")}`,
      }, { contestable: false });
    } catch {
      salio = false;
    }
    if (!salio) return 0;
    let cerradas = 0;
    for (const c of filas) {
      try {
        await base.cerrarTurno(c.id, Number(c.ultimo_id_lead));
        // Para el modelo, si el lead vuelve a escribir: lo de arriba quedó sin respuesta.
        await base.anotar(c.id, "sistema", "El agente no llegó a contestar lo de arriba: pasó casi un día y Instagram ya no dejaba escribirle");
        cerradas++;
      } catch {
        // sin base no se cierra: sale de nuevo en el aviso de la vuelta siguiente
      }
    }
    return cerradas;
  }

  /**
   * Un mensaje que llega por la entrada. Devuelve el id con el que quedó guardado, o null si no
   * se guardó nada: la charla es de Cande, es un reintento, o es alguien nuevo y no entró.
   *
   * Con las altas prendidas, quien nunca pasó por la base queda del agente. El aviso a Cande sale
   * recién en su primer turno, cuando el modelo dice si es un lead (ver procesar): a la entrada
   * también llegan amigos y charlas suyas, y Cande pidió (15/10) que a Telegram vayan solo los
   * leads. El tope de 24 horas es la red por si el filtro de ManyChat se rompe: cuando se llena se
   * le avisa. Con el agente apagado no entra nadie.
   *
   * Si el mensaje ya lo guardó la red de la bandeja (lib/dm/bandeja.js: el webhook llegó tarde, o la persona
   * entró por ahí), no se guarda otra vez: la respuesta pudo haber salido ya, y saldría dos veces (ver ecoDeLaRed).
   * `mid`: el id del mensaje en Instagram, si el webhook lo trae.
   */
  async function recibir(id, texto, nombre = null, { mid = null } = {}) {
    if (await ecoDeLaRed(id, texto, mid)) return null;
    const guardado = await base.anotarLead(id, texto, nombre);
    if (guardado) return guardado;
    const aj = await base.ajustes();
    if (aj.altas !== true || !prendido(aj)) return null;
    const van = await base.lugarParaAlta(id, aj.altas_por_dia);
    if (van !== null) {
      const primero = await base.darDeAlta(id, { nombre, texto, contexto: aj.contexto_alta, tope: aj.altas_por_dia });
      if (primero && van + 1 >= aj.altas_por_dia) {
        await avisarACande({ id }, "DM: se llenó el tope de altas", {
          "Van en 24 horas": `${van + 1} de ${aj.altas_por_dia}`,
          Aviso: "no entra nadie nuevo hasta que pasen 24 horas de las primeras altas: mirá que ManyChat esté filtrando bien",
        });
      }
      if (primero) return primero;
    }
    // No hubo alta acá. Si la hizo recién el mensaje de al lado, este se guarda igual; si la charla
    // es de Cande o no queda lugar, no se guarda nada.
    return base.anotarLead(id, texto, nombre);
  }

  /**
   * Si este mensaje que llega por la entrada es uno que ya guardó la red de la bandeja (el webhook llegó tarde),
   * entre lo que guardó en las últimas 24 horas (contadas desde que lo guardó):
   *   - Con el id del mensaje de Instagram (`mid`, si el webhook lo trae), es la prueba: el mismo id es el eco
   *     (también su reintento), y un id que la red no guardó es otro mensaje.
   *   - Un adjunto (esAdjunto: una foto, un audio, un reel compartido; la red lo guarda sin texto y ManyChat trae
   *     nada, el link de Meta o el del reel) es el eco de un adjunto que el lead mandó hace 15 minutos como mucho
   *     (ECO_ADJUNTO_MS, con la hora de Instagram contra la de ahora). Dos adjuntos cualesquiera no son el mismo:
   *     la foto del comprobante que llega después entra.
   *   - Un texto es el eco del mismo texto (mismoTexto: sin tildes, mayúsculas ni signos).
   * Sin el id, cada uno absorbe un solo pedido del webhook (más un reintento de ManyChat en el minuto siguiente):
   * si después el lead escribe otra vez lo mismo de verdad, se guarda. Y si alguna vez se absorbiera uno nuevo
   * (otra foto en esos 15 minutos), la red lo ve sin guardar en la bandeja y lo guarda ella.
   */
  async function ecoDeLaRed(id, texto, mid = null) {
    const red = await base.guardadosPorLaRed(id);
    if (mid) {
      const g = red.find((x) => x.ig_mid === mid);
      if (g && !g.eco_en) await base.marcarEco(g.id);
      return Boolean(g);
    }
    const ahora = reloj().getTime();
    const cerca = (g) => {
      const dif = ahora - new Date(g.creado).getTime();
      return dif >= -60000 && dif <= ECO_ADJUNTO_MS; // un minuto de margen por la diferencia de relojes
    };
    const iguales = red.filter((g) => (esAdjunto(texto) ? esAdjunto(g.texto) && cerca(g) : !esAdjunto(g.texto) && mismoTexto(g.texto, texto)));
    for (const g of iguales) if (!g.eco_en && (await base.marcarEco(g.id))) return true;
    return iguales.some((g) => g.eco_reciente === true);
  }

  /**
   * Decide y ejecuta. `idDisparo` es el mensaje del lead que arrancó esta corrida.
   * `tarde`: el cron reintenta un mensaje que no se pudo contestar (la Mac sin red, el modelo caído).
   * Sin espera, y la respuesta sale por la API de ManyChat: el retiro del flujo ya pasó.
   */
  async function procesar(id, idDisparo, opciones = {}) {
    // Con la Mac contestando, la foto del lead la mira el agente y el aviso URGENTE de siempre queda para si
    // no la pudo ver: esta corrida se queda con ese aviso (fotos.aCargo). Una foto queda resuelta solo cuando
    // sale su aviso (o el del pago con ella): la constancia está en la base (avisarFotos, avisarPago), no acá.
    // Termine como termine el turno (la charla pasó a Cande, se apagó, falló algo), las fotos de este turno que
    // siguen sin aviso salen acá con el URGENTE. Si tampoco sale, quedan sin constancia y las reintenta el cron
    // de los toques, sea de quien sea la charla. No se intenta acá si el turno lo sigue otra corrida (fotos.deOtra:
    // llegó otro mensaje, esa se encarga) o si esta ya lo intentó y no salió (fotos.sinSalir: Telegram caído;
    // reintentarlo enseguida tardaría y fallaría igual).
    const fotos = { aCargo: false, deOtra: false, sinSalir: false };
    try {
      return await procesarTurno(id, idDisparo, opciones, fotos);
    } finally {
      if (fotos.aCargo && !fotos.deOtra && !fotos.sinSalir) await avisarFotos(id, { cualquierDueno: true, limite: idDisparo ?? Infinity });
    }
  }

  async function procesarTurno(id, idDisparo, { evento = null, tarde = false, indicacion = "" } = {}, fotos) {
    // Lo devuelve una corrida que le deja el turno a otra: las fotos sin aviso son de esa.
    const deOtra = (r) => {
      fotos.deOtra = true;
      return r;
    };
    // El URGENTE de las fotos dentro del turno: si no sale, el final de procesar no lo vuelve a intentar.
    const urgenteDeFotos = async () => {
      const r = await avisarFotos(id, { cualquierDueno: true });
      if (r.faltan) fotos.sinSalir = true;
      return r;
    };
    // Los avisos de lo que vio el agente en las fotos (y del pago en pesos): se preparan antes de la respuesta y
    // salen al final del turno (ver el finally de abajo).
    let avisarLoQueVio = null;
    // evento "seguimiento": un toque. evento "indicacion": Cande le respondió un aviso desde Telegram
    // con lo que quiere que le diga (lib/dm/respuestas.js); el agente le escribe al lead siguiéndola.
    const esToque = evento === "seguimiento";
    const esIndicacion = evento === "indicacion";
    await base.tablas();
    let aj = await base.ajustes();
    if (!prendido(aj)) return { hecho: "apagado" };
    if (esToque && aj.toques !== true) return { hecho: "toques apagados" };

    let fotosAlEntrar = { faltan: 0 };
    if (!evento) {
      // La foto se avisa ya: sin esperar la ráfaga ni al modelo (que con la Mac apagada no llega nunca).
      // También en la espera: la corrida de la entrada pudo cortarse antes de avisar. Con la Mac contestando
      // no: la mira el agente (ver procesar).
      let ve = false;
      try {
        ve = (await veFotos(aj)) === true;
      } catch {
        ve = false;
      }
      if (!ve) fotosAlEntrar = await avisarFotos(id);
      else fotos.aCargo = await hayFotosSinAviso(id);
      if (!tarde) await esperar(aj.espera_ms);
      // Si mientras tanto llegó otro mensaje, contesta la corrida de ese mensaje.
      if ((await base.ultimoIdLead(id)) !== idDisparo) return deOtra({ hecho: "llegó otro mensaje" });
      aj = await base.ajustes(); // pudieron apagarlo durante la espera
      if (!prendido(aj)) return { hecho: "apagado" };
    }

    let c = await base.contacto(id);
    // Una indicación de Cande no cambia de quién es la charla: si es de ella, el agente escribe ese
    // mensaje y la charla sigue siendo de ella (16/10, con Alain: "dejame solo en este caso").
    const deCandeOk = esIndicacion;
    if (!c || (c.dueno !== "agente" && !deCandeOk)) return { hecho: "no es del agente" };
    // En el envío por campo ManyChat retira la respuesta cuando el lead escribe: a un toque no lo
    // retira nadie, así que el toque sale por la API de ManyChat (ver porCampo, más abajo). Sin la
    // clave no hay por dónde mandarlo: ni se le pide al modelo.
    if (evento && manychat.hayManyChat && !manychat.hayManyChat()) return { hecho: "sin toques: falta la clave de ManyChat" };

    // Traba. Si la tiene otra corrida, la de un mensaje nuevo espera a que termine: si las dos se
    // bajaran (una por la traba, la otra porque llegó este mensaje), el lead quedaría sin respuesta.
    const marca = randomUUID();
    const opcionesTraba = { cualquierDueno: deCandeOk };
    let tomado = await base.tomar(id, marca, opcionesTraba);
    for (let i = 0; !tomado && !evento && i < VUELTAS_DE_TRABA; i++) {
      await esperar(ESPERA_DE_TRABA_MS);
      if ((await base.ultimoIdLead(id)) !== idDisparo) return deOtra({ hecho: "llegó otro mensaje" });
      tomado = await base.tomar(id, marca);
    }
    if (!tomado) {
      c = await base.contacto(id);
      if (!c || (c.dueno !== "agente" && !deCandeOk)) return { hecho: "no es del agente" };
      if (!evento) {
        await pasarACande(c, {
          aviso: "quedó un mensaje sin contestar: otra corrida tenía la charla tomada", motivo: "traba",
        });
      }
      return { hecho: "otra corrida lo tiene" };
    }
    c = tomado; // el contacto como está ahora, ya con la traba

    // Lo que hay que saber si algo falla más abajo: qué dijo el lead y si ya había una salida anotada.
    let ultimo = "";
    let idSalida = null;
    const cerrarTurno = () => (evento ? null : base.cerrarTurno(id, idDisparo));
    // reintentar: el modelo no dio una respuesta para un mensaje del lead. El turno queda abierto y la
    // charla sigue del agente, sin aviso: queda en espera y la contesta el cron de la espera cuando el
    // modelo vuelve, por más horas que pasen (19/10, Cande: "deberían quedar on hold"). La falla queda
    // anotada como general (la Mac apagada, dormida o sin uso: le pasa a cualquier charla), propia de
    // esta charla (el modelo se negó o contestó algo que no se puede leer) o dudosa (la Mac contestó que
    // no pudo): para pasársela a Cande cuentan las propias, y las dudosas si las demás charlas salían
    // (base.sinContestar, decidirSinContestar). Los de un reintento quedan con accion "reintento".
    const fallar = async (e, hecho, { reintentar = false } = {}) => {
      const general = e?.general !== false;
      const dudosa = general && e?.dudosa === true;
      try {
        if (idSalida) await base.marcarSalida(idSalida, "error", corto(e.message, 400));
        else {
          await base.guardarSalida({
            contacto: id, accion: tarde ? "reintento" : "error", estado: "error",
            motivo: reintentar ? (!general ? FALLA_PROPIA : dudosa ? FALLA_DUDOSA : FALLA_GENERAL) : null,
            detalle: corto(e.message, 400),
          });
        }
        if (!reintentar) await cerrarTurno();
      } catch {
        // con la base caída no queda constancia, pero el aviso sale igual
      }
      if (reintentar) return { hecho, error: e.message, reintento: true, transitorio: e?.transitorio === true, general, dudosa };
      // Un toque que falla (la Mac dormida, el modelo que no contesta) no deja a nadie esperando:
      // queda anotado y la charla sigue del agente. Pasarla le sacaría al agente un lead sano.
      if (!evento) await pasarACande(c, { aviso: "el agente falló y no contestó nada", motivo: corto(e.message, 200), ultimo });
      return { hecho, error: e.message, transitorio: e?.transitorio === true, general, dudosa };
    };

    try {
      const ultimoLead = c.ultimo_lead ? new Date(c.ultimo_lead) : null;
      // En una charla de Cande lo que escribió el lead no se guarda acá y ultimo_lead puede estar viejo:
      // con una indicación decide ManyChat (si pasó el día, contesta 3011 y se le dice a ella).
      if (!esIndicacion && !ventanaAbierta(reloj(), ultimoLead)) return { hecho: "ventana de 24 horas cerrada" };
      if (esToque && c.toques >= MAX_TOQUES) return { hecho: "ya tuvo sus dos toques" };
      if (esToque && reloj() - ultimoLead < MINIMO_ANTES_DE_UN_TOQUE) return { hecho: "todavía no toca" };

      // Cande la sigue en Instagram o escribió "--" en el chat (16/10): el agente sale sin aviso,
      // ella ya sabe. Con una indicación no: es ella pidiendo que le escriba.
      const fuera = esIndicacion ? null : await deCandePorInstagram(aj, c);
      if (fuera) {
        await cerrarTurno();
        await instagram.sacar(c, fuera);
        return { hecho: "de Cande por Instagram", motivo: fuera };
      }

      // Los frenos miran todo lo que escribió el lead (una charla cargada a mano puede traer 300
      // mensajes, y lo que contó al principio sigue valiendo). Al modelo le van los últimos 80.
      const todos = await base.historial(id, HISTORIAL_PARA_LOS_FRENOS);
      const mensajes = todos.slice(-HISTORIAL_PARA_EL_MODELO);
      const delLead = todos.filter((m) => m.quien === "lead");
      const charlaDelLead = delLead.map((m) => m.texto);
      // El último mensaje del lead que esta corrida vio. Si no es el que la disparó, llegó otro
      // mientras esperaba la traba: contesta la corrida de ese.
      const ultimoVisto = delLead.at(-1)?.id ?? null;
      if (!evento && ultimoVisto !== idDisparo) return deOtra({ hecho: "llegó otro mensaje" });
      // Un toque solo sale con todo lo del lead ya atendido: si escribió recién (entre que el toque
      // tomó la charla y esta lectura), contesta la corrida de su mensaje y el toque no va.
      if (esToque && (ultimoVisto ?? 0) > (c.respondido_hasta || 0)) return { hecho: "hay un mensaje del lead sin atender" };
      // Lo último de la charla, sea de quien sea. Si cambia mientras se genera el toque (Cande le
      // contestó desde Telegram, anotó algo a mano, o escribió el lead), el toque ya no corresponde.
      const ultimoDeLaCharla = todos.at(-1)?.id ?? null;
      const charlaCambio = async () => ((await base.historial(id, 1)).at(-1)?.id ?? null) !== ultimoDeLaCharla;

      // Un reintento tarde no contesta encima de Cande: si ella escribió en la charla después del
      // primer mensaje sin atender (desde Telegram), está metida ahí y la charla pasa a ella, con lo
      // que falta contestar. Qué está atendido lo dice respondido_hasta, como siempre.
      const desdeTurno = c.respondido_hasta || 0;
      const primero = todos.find((m) => m.quien === "lead" && m.id > desdeTurno);
      if (tarde && primero && todos.some((m) => m.quien === "cande" && m.id > primero.id)) {
        await pasarACande(c, {
          aviso: "le escribiste mientras el agente no podía contestar: la charla vuelve a vos",
          motivo: "Cande en la charla", ultimo: todos.filter((m) => m.quien === "lead" && m.id > desdeTurno).map((m) => m.texto).join(" / "),
        });
        return { hecho: "pasada a Cande" };
      }
      const desde = primero?.creado ? new Date(primero.creado) : ultimoLead;
      const horasTarde = tarde && desde ? Math.round(((reloj() - desde) / HORA) * 10) / 10 : 0;
      // Sin disculparse por la demora: los frenos la frenan (da a entender una persona que se atrasó).
      const notaTarde = tarde
        ? `Contestás tarde: el lead escribió hace ${Math.max(1, Math.round(horasTarde * 60))} minutos y no le llegó respuesta. Contestá lo suyo normal, sin disculparte por la demora.`
        : null;
      // Si llenó el formulario con el link de esta charla, la nota está en el historial (anotarFormularioLleno en
      // lib/dm/base.js). En una charla larga puede quedar más atrás de los 80 mensajes que le llegan al modelo:
      // entonces va en el contexto, para que no le vuelva a preguntar si lo llenó.
      const notaFormulario = todos.some(esNotaDeFormulario) && !mensajes.some(esNotaDeFormulario) ? NOTA_FORMULARIO : null;
      const turno = armarTurno(mensajes, {
        evento, ahora: reloj(), ultimoLead, toque: c.toques, desde: desdeTurno,
        contexto: [c.contexto, notaFormulario, notaTarde, esIndicacion ? notaIndicacion(indicacion) : null].filter(Boolean).join(" ") || null,
      });
      ultimo = turno.mensajes_del_lead.join(" / ") || charlaDelLead.at(-1) || "";
      // Sin mensajes nuevos y sin ser un seguimiento: mientras esta corrida esperaba, Cande anotó
      // su respuesta o volvió a darle la charla al agente. Un turno vacío el modelo lo lee como un
      // seguimiento, así que no se le pide nada.
      if (!evento && !turno.mensajes_del_lead.length) return { hecho: "ya estaba atendido" };
      // Las fotos de este turno que todavía no tienen su aviso: con la Mac contestando las mira el agente, por
      // su link (el que manda ManyChat o, si llegó sin link, el que da Instagram). Si falta el de alguna, van a
      // Cande como siempre.
      let imagenes = [];
      let fotosVistas = [];
      if (fotos.aCargo) {
        fotosVistas = fotosSinSuAviso(todos.filter((m) => m.quien === "lead" && m.id > desdeTurno), c, { soloAntes: true });
        if (fotosVistas.length) imagenes = await linksDeFotos(c, fotosVistas);
        if (fotosVistas.length && !imagenes.length) fotosAlEntrar = await urgenteDeFotos();
      }
      // Lo que escribió en el turno, sin las fotos: para el aviso del pago.
      const dijo = turno.mensajes_del_lead.filter((t) => !esFoto(t)).join(" / ");
      // Solo fotos (o archivos): el agente no las puede ver y no adivina. No le escribe nada en este
      // turno, la charla sigue suya y el turno queda atendido (la espera no lo vuelve a tomar ni a
      // avisar): a Cande le llegó el aviso URGENTE (avisarFotos) y contesta ella. Si con la foto vino
      // texto, se contesta normal.
      // Atendido solo si cada foto tiene su aviso. Si el de arriba no salió, el turno queda abierto: lo
      // vuelven a intentar la espera y el cron de los toques (enseguida fallaría igual). Si lo estaba
      // mandando otra corrida, se mira de nuevo acá: pudo no salir. La charla no pasa: no hay nada que pasar.
      if (!evento && turno.mensajes_del_lead.every(esFoto) && !imagenes.length) {
        if (fotosAlEntrar.faltan || (await urgenteDeFotos()).faltan) return { hecho: "foto sin avisar" };
        await cerrarTurno();
        return { hecho: "solo foto" };
      }
      const noSeguir = (estado) =>
        sinSeguimiento({ estado, charlaDelLead, ultimoTurnoDelLead: ultimoTurnoDelLead(mensajes) });

      // Si a este lead no hay que insistirle, el toque se cancela acá: ni se le pide al modelo.
      if (esToque && noSeguir(c.estado)) {
        await base.guardarEstado(id, c.estado, null);
        return { hecho: "toque cancelado" };
      }

      if ((await base.corridasEnUnDia(id)) >= aj.tope_por_dia) {
        await cerrarTurno();
        if (!evento) await pasarACande(c, { aviso: "llegó al tope de turnos del día", motivo: "tope", ultimo });
        return { hecho: "tope del día" };
      }

      const textoPrompt = (await base.prompt()).replaceAll("{LINK_DE_PAGO}", aj.link_de_pago || "(sin cargar)")
        .replaceAll("{LINK_MERCADOPAGO}", aj.link_mercadopago || "(sin cargar)");
      if (!textoPrompt) throw new Error("no hay prompt cargado");

      // Un toque (y un reintento tarde) suelta la traba mientras se genera: si el lead escribe en ese
      // rato, la corrida de su mensaje tiene que poder arrancar ya (ManyChat retira la respuesta a
      // los ~50 segundos). Al volver la retoma; si la tiene esa corrida, o si el lead escribió, no sale.
      if (evento || tarde) await base.soltar(id, marca);
      let salida;
      let vistas = 0;
      try {
        // Con fotos, sus links van con el turno: la Mac se las muestra a Claude y dice cuántas pudo ver.
        const crudo = await pedir(imagenes.length ? { prompt: textoPrompt, turno, imagenes } : { prompt: textoPrompt, turno });
        vistas = Number.isInteger(crudo?._imagenes_vistas) ? crudo._imagenes_vistas : 0;
        salida = normalizar(crudo);
      } catch (e) {
        // El modelo no pudo con un turno con fotos: la foto va ya a Cande, como siempre, y el turno no queda
        // trabado. Lo que haya escrito junto con la foto sigue como cualquier mensaje (abajo).
        if (imagenes.length) {
          const aviso = await urgenteDeFotos();
          if (turno.mensajes_del_lead.every(esFoto)) {
            if (aviso.faltan) return { hecho: "foto sin avisar", error: e.message };
            await cerrarTurno();
            return { hecho: "solo foto", error: e.message };
          }
        }
        // El modelo no dio respuesta: el mensaje del lead queda en espera (ver fallar), sea lo que sea.
        // Ni pasa a Cande ni se le avisa: si es la Mac, se arregla cuando vuelve; si es esta charla, la
        // pasa el cron cuando falló las veces del tope. Un toque o una indicación quedan anotados y
        // nadie espera nada.
        return await fallar(e, "error del modelo", { reintentar: !evento });
      }
      if ((evento || tarde) && !(await base.tomar(id, marca, opcionesTraba))) {
        await base.guardarSalida({
          contacto: id, accion: salida.accion, motivo: salida.motivo, estado: "descartada",
          detalle: "mientras se generaba, otra corrida tomó la charla",
        });
        return deOtra({ hecho: "otra corrida lo tiene" });
      }
      // En un toque nadie espera respuesta: si el modelo (o la revisión de la Mac) prefiere pasarla,
      // el toque no sale y la charla sigue del agente. Cande se entera si el aviso es urgente.
      // Con una indicación, si el agente prefiere no escribir, no sale nada y a Cande se le dice por qué.
      if (esIndicacion && salida.accion === "pasar_a_cande") {
        await base.guardarSalida({ contacto: id, accion: salida.accion, motivo: salida.motivo, estado: "descartada", detalle: "indicación: el agente prefirió no escribir" });
        return { hecho: "el agente prefirió no escribir", aviso: salida.aviso_para_cande, motivo: salida.motivo };
      }
      if (evento && salida.accion === "pasar_a_cande") salida = { ...salida, accion: "callar", mensajes: [] };

      // Escribió mientras se generaba: esta respuesta ya es vieja. La corrida de ese mensaje sigue
      // (está esperando la traba), y un toque que quedó pisado no sale. Queda anotada igual: le
      // costó un pedido al modelo, y sin eso quien escribe sin parar nunca llega al tope del día.
      if ((await base.ultimoIdLead(id)) !== ultimoVisto) {
        await base.guardarSalida({
          contacto: id, accion: salida.accion, motivo: salida.motivo, estado: "descartada",
          detalle: "escribió mientras se generaba",
        });
        return deOtra({ hecho: "llegó otro mensaje durante la generación" });
      }
      if ((evento || tarde) && (await charlaCambio())) {
        await base.guardarSalida({
          contacto: id, accion: salida.accion, motivo: salida.motivo, estado: "descartada",
          detalle: "mientras se generaba el toque, se escribió en la charla",
        });
        return deOtra({ hecho: "la charla cambió durante la generación" });
      }

      // Alguien que entró solo y todavía no se anunció: recién ahora, con lo que decidió el modelo, se
      // sabe si es un lead. Una charla personal (callar con quien no_dev: freno 0 del prompt) se borra y
      // queda de Cande, sin aviso ni nada guardado. Un lead recibe el aviso de alta y sigue.
      if (c.alta_en && c.alta_avisada === false) {
        if (salida.accion === "callar" && salida.estado.quien === "no_dev") {
          await base.borrarCharla(id);
          return { hecho: "charla personal: queda de Cande, sin aviso" };
        }
        // Sin aviso: lo atiende el agente. A Cande le llega solo lo que necesita que haga algo (16/10).
        await base.marcarAltaAvisada(id);
      }

      // La foto y el pago en pesos (19/10): lo que vio el agente le llega a Cande, salga o no lo que redactó. El
      // borrador del código se guarda ya; los avisos salen al final del turno, con la respuesta lista para
      // retirar o mandada: la foto puede tardar 10 segundos en Telegram, y con el envío por campo ManyChat no la
      // alcanzaría a retirar. Si hubo aviso del pago, ese lleva el aviso del modelo (avisoSuelto, abajo).
      let conAvisoDePago = false;
      if (!evento) {
        conAvisoDePago = Boolean(pagoQueVale(salida, { imagenes, vistas }));
        avisarLoQueVio = await prepararLoQueVio(c, { salida, imagenes, vistas, fotosVistas, dijo, todos, aj });
      }

      // El código de acceso no sale nunca en lo que escribe el agente (frenoDelCodigo): ni en una respuesta, ni en
      // un toque, ni en una respuesta tarde, ni con una indicación de Cande. Todo lo que el agente le manda al lead
      // pasa por acá. Después, lo que pidió Cande lo decide ella: los demás frenos son para lo que redacta el
      // agente solo (ella sí puede ofrecer su tiempo o una fecha). Con la indicación solo cuidan el largo y los
      // datos de pago.
      const freno = frenoDelCodigo(salida, aj.codigo_mercadopago) || (esIndicacion ? revisarIndicacion(salida) : revisar(salida, {
        textosDelLead: turno.mensajes_del_lead, charlaDelLead, estadoPrevio: c.estado, linkDePago: aj.link_de_pago,
        // El de pago en pesos (el link con el código de acceso lo frena frenoDelCodigo, arriba).
        otrosPagos: [aj.link_mercadopago].filter(Boolean),
        // El aviso de que es automático tiene que figurar en lo que salió de la cuenta, lo haya
        // mandado el agente o Cande con un borrador suyo. Con aviso_ia en false no se exige.
        exigirAviso: aj.aviso_ia !== false &&
          !todos.some((m) => (m.quien === "agente" || m.quien === "cande") && avisaQueEsAutomatico(m.texto)),
        // El link del formulario puede llevar el id de esta charla (lo copió del historial) y ningún otro.
        contacto: id,
      }));
      let texto = salida.mensajes.join(" / ");
      // Lo que el modelo quiere que Cande sepa aunque la charla siga siendo del agente.
      const avisoSuelto = async (mandado) => {
        // Solo lo urgente (HOY: / YA:). Las notas del modelo quedan guardadas con la salida (16/10: "me
        // explota el celular"). Si hubo aviso del pago, ya lo llevó.
        if (conAvisoDePago || !salida.aviso_para_cande || !esUrgente(salida.aviso_para_cande)) return;
        await avisarACande(c, `DM${esUrgente(salida.aviso_para_cande) ? " URGENTE" : ""}: aviso del agente`, {
          Quién: quienEs(c), Dijo: corto(ultimo), "El agente le mandó": corto(mandado), Aviso: salida.aviso_para_cande,
        });
      };
      if (!freno.ok) {
        await base.guardarSalida({
          contacto: id, accion: salida.accion, mensajes: salida.mensajes, aviso: salida.aviso_para_cande,
          motivo: salida.motivo, estado: "frenada", detalle: freno.motivo,
        });
        await cerrarTurno();
        // Un toque frenado simplemente no sale: el lead no está esperando nada.
        if (!evento) {
          await pasarACande(c, {
            aviso: `Frené lo que iba a mandar (${freno.motivo}): ${corto(texto)}`,
            avisoModelo: salida.aviso_para_cande, motivo: freno.motivo, ultimo,
          });
        }
        return { hecho: "frenada", motivo: freno.motivo };
      }

      // El link del formulario sale con el id de esta charla y su firma (opengatehub.com/devs?ig=<id>&f=<firma>,
      // lib/dm/linkFormulario.js y lib/dm/firmaIg.js): así el formulario sabe de qué charla viene quien lo llena, y
      // Cande no lo llama por WhatsApp sin saber que ya habla con el agente; con la firma, un número cambiado a mano
      // no se ata a otra charla. Sin clave en el entorno sale sin firma. Va después de los frenos (miran lo que
      // escribió el modelo) y antes de guardar y mandar: lo que ve el lead es lo mismo que queda en dm_salidas y
      // dm_mensajes, también en un borrador, un toque o lo que pidió Cande. Si con el id el mensaje llevara el
      // código de acceso (un id o una firma que lo contiene), sale como estaba.
      const firma = firmarIg(id);
      const conId = salida.mensajes.map((m) => conIdDeCharla(m, id, { firma }));
      if (conId.some((m, i) => m !== salida.mensajes[i]) && !frenoDelCodigo({ mensajes: conId }, aj.codigo_mercadopago)) {
        salida = { ...salida, mensajes: conId };
        texto = salida.mensajes.join(" / ");
      }

      // El próximo seguimiento, si corresponde. Antes del link va uno solo; después, hasta dos.
      // Después de un toque (o de una respuesta que salió tarde), el siguiente nunca antes de 4 horas:
      // lo que salió tarde (la Mac dormida, la noche) no puede tener otro mensaje pegado.
      const toque = aj.toques !== true || noSeguir(salida.estado) ? null : proximoToque({
        ahora: reloj(), ultimoLead, horas: salida.seguimiento_en_horas,
        toquesHechos: c.toques + (esToque ? 1 : 0),
        maxToques: salida.estado.link_formulario_enviado ? MAX_TOQUES : 1,
        noAntesDe: evento || tarde ? new Date(reloj().getTime() + ENTRE_TOQUES) : null,
      });

      if (salida.accion === "callar") {
        await base.guardarSalida({
          contacto: id, accion: "callar", aviso: salida.aviso_para_cande, motivo: salida.motivo, estado: "callo",
        });
        // Callar ante un mensaje puede dejar un seguimiento ("lo lleno ahora"); callar en un toque, no.
        await base.guardarEstado(id, salida.estado, evento ? null : toque);
        await cerrarTurno();
        await avisoSuelto("");
        return { hecho: "calló" };
      }

      // Sombra: no manda. Deja el borrador y le avisa a Cande con lo que mandaría.
      if (aj.modo === "sombra") {
        await base.guardarSalida({
          contacto: id, accion: salida.accion, mensajes: salida.mensajes, aviso: salida.aviso_para_cande,
          motivo: salida.motivo, estado: "borrador",
        });
        await base.guardarEstado(id, salida.estado, null);
        await cerrarTurno();
        await avisarACande(c, `DM${esUrgente(salida.aviso_para_cande) ? " URGENTE" : ""}: borrador del agente`, {
          Quién: quienEs(c), Dijo: corto(ultimo), Mandaría: salida.mensajes.join("  /  "),
          Acción: salida.accion, Aviso: salida.aviso_para_cande,
        });
        return { hecho: "borrador" };
      }

      // Mientras se generaba, Cande pudo abrir la charla en Instagram y escribir "--". Va antes de la
      // última mirada: esta lectura tarda, y lo que Cande haga mientras tanto lo ve la mirada de abajo.
      if (!esIndicacion && miraInstagram(aj)) {
        const cIg = (await base.contacto(id)) || c; // con el id de Instagram que encontró la primera mirada
        const fueraAhora = await deCandePorInstagram(aj, cIg);
        if (fueraAhora) {
          await base.guardarSalida({
            contacto: id, accion: salida.accion, mensajes: salida.mensajes, motivo: salida.motivo, estado: "descartada",
            detalle: `mientras se generaba: ${fueraAhora}`,
          });
          await cerrarTurno();
          await instagram.sacar(cIg, fueraAhora);
          return { hecho: "de Cande por Instagram", motivo: fueraAhora };
        }
      }

      // Última mirada antes de mandar: generar tarda, y en ese rato Cande pudo apagar todo,
      // tomar la charla o anotar que ya contestó ella. Lo que se leyó al principio ya no vale.
      aj = await base.ajustes();
      c = (await base.contacto(id)) || c;
      const sigueAbierta = ventanaAbierta(reloj(), c.ultimo_lead ? new Date(c.ultimo_lead) : null);
      const yaAtendido = !evento && (c.respondido_hasta || 0) >= idDisparo;
      const cambio = (evento || tarde) && (await charlaCambio());
      const duenoOk = c.dueno === "agente" || deCandeOk;
      if (aj.modo !== "auto" || !duenoOk || (!sigueAbierta && !esIndicacion) || yaAtendido || cambio) {
        await base.guardarSalida({
          contacto: id, accion: salida.accion, mensajes: salida.mensajes, motivo: salida.motivo, estado: "descartada",
          detalle: "se apagó, la tomó o la contestó Cande, o cerró la ventana mientras se generaba",
        });
        return { hecho: "descartada" };
      }

      // Constancia ANTES de mandar: la salida, el toque contado y el dueño nuevo si la charla se
      // pasa. Si la función muere después de mandar, la base ya sabe que salió y no se repite.
      const pasa = salida.accion === "pasar_a_cande";
      // ManyChat lo retira con /api/dm/recoger. Un toque no: no hay mensaje del lead que lo dispare.
      // Un reintento tarde tampoco: el flujo que lo iba a retirar ya terminó.
      const porCampo = aj.envio === "campo" && !evento && !tarde && salida.mensajes.length > 0;
      idSalida = await base.guardarSalida({
        contacto: id, accion: salida.accion, mensajes: salida.mensajes, aviso: salida.aviso_para_cande,
        motivo: salida.motivo, estado: porCampo ? "pendiente" : "enviando",
      });
      if (esToque) await base.sumarToque(id);
      if (pasa) await base.ponerDueno(id, "cande");

      // Lo que había quedado para que ManyChat lo retire ya no sale detrás de lo que pidió Cande.
      if (esIndicacion) await base.descartarPendientes(id);
      let envio = { ok: true };
      if (salida.mensajes.length && !porCampo) envio = await manychat.mandarTextos(id, salida.mensajes);
      if (!envio.ok && !envio.incierto) {
        await base.marcarSalida(idSalida, "error", envio.error);
        await cerrarTurno();
        if (evento) return { hecho: "error al mandar", error: envio.error, code: envio.code }; // el toque no salió y nadie espera
        await pasarACande(c, {
          aviso: `No pude mandar: ${corto(texto)}`, avisoModelo: salida.aviso_para_cande, motivo: envio.error, ultimo,
        });
        return { hecho: "error al mandar", error: envio.error };
      }

      // Ya salió (o quedó para retirar). Si falla algo de acá en adelante no es "no contestó nada".
      const enviado = porCampo ? `(para que ManyChat lo retire) ${texto}` : texto;
      try {
        if (!porCampo) {
          await base.marcarSalida(idSalida, envio.incierto ? "incierta" : "enviada", envio.incierto ? envio.error : null);
          // En el envío por campo los anota /api/dm/recoger cuando ManyChat los retira: una sola vez.
          for (const m of salida.mensajes) await base.anotar(id, "agente", m);
        }
        await base.guardarEstado(id, salida.estado, pasa || envio.incierto ? null : toque);
        // En el envío por campo el turno lo cierra el retiro (retirarSalida): si el lead escribe
        // antes, esa respuesta se vence sin salir y su mensaje tiene que seguir en el turno.
        if (!porCampo) await cerrarTurno();
        // Lo que el lead había escrito ya quedó contestado con lo que pidió Cande.
        if (esIndicacion && ultimoVisto) await base.cerrarTurno(id, ultimoVisto);
      } catch (e) {
        await pasarACande(c, {
          aviso: "Esto salió pero no lo pude guardar: mirá la charla antes de contestar",
          avisoModelo: salida.aviso_para_cande, motivo: corto(e.message, 200), ultimo, enviado,
        });
        return { hecho: "enviada sin guardar", mando: salida.mensajes.length };
      }

      if (envio.incierto) {
        // Un toque incierto queda anotado como salido y no se reintenta: nadie lo reenvía a mano.
        if (!evento) {
          await pasarACande(c, {
            aviso: "No sé si salió: mirá la charla antes de reenviar", avisoModelo: salida.aviso_para_cande,
            motivo: envio.error, ultimo, enviado,
          });
        }
        return { hecho: "envío incierto" };
      }
      if (pasa) {
        await pasarACande(c, { aviso: salida.aviso_para_cande, motivo: salida.motivo, ultimo, enviado });
        return { hecho: "pasada a Cande", mando: salida.mensajes.length };
      }
      await avisoSuelto(enviado);
      return { hecho: porCampo ? "lista para retirar" : "enviada", mando: salida.mensajes.length, enviado: salida.mensajes };
    } catch (e) {
      // Cualquier otra falla (el prompt sin cargar, una consulta que no anda) termina igual que
      // un error del modelo: al lead nada, la charla a Cande y el aviso.
      return await fallar(e, "error");
    } finally {
      // Lo que vio el agente, con la respuesta ya lista para retirar o mandada (o el turno terminado sin ella:
      // frenada, pasada a Cande, descartada) y la traba todavía tomada: así el cron de los toques no manda el
      // mismo aviso del código mientras sale este (base.codigosSinAviso deja afuera las charlas tomadas).
      if (avisarLoQueVio) {
        try {
          if ((await avisarLoQueVio()).faltan) fotos.sinSalir = true;
        } catch {
          // lo vuelve a intentar el final de procesar, y si tampoco sale, el cron de los toques
        }
      }
      try {
        await base.soltar(id, marca);
      } catch {
        // la traba se libera sola a los 6 minutos
      }
    }
  }

  return { recibir, procesar, pasarACande, avisarSinVentana, avisarFotosPendientes, avisarCodigosPendientes };
}
