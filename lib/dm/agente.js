// El agente de DM: qué pasa con cada mensaje que entra.
//
//   1. Espera unos segundos y junta la ráfaga (3 de cada 10 turnos llegan en varios mensajes).
//   2. Toma la traba del contacto: una sola corrida por charla a la vez.
//   3. Le pide la respuesta al modelo, con toda la charla.
//   4. Pasa la respuesta por los frenos (lib/dm/frenos.js).
//   5. Vuelve a mirar que siga prendido y que la charla siga siendo suya, deja constancia y
//      recién ahí manda, deja un borrador, calla o le pasa la charla a Cande.
//
// Si algo falla, sea lo que sea, al lead no le llega nada: la charla pasa a ser de Cande y
// se le avisa. Las dependencias (base, modelo, ManyChat, aviso) entran por parámetro para
// poder probarlo con dobles, sin base ni red.
import { randomUUID } from "node:crypto";
import {
  MAX_TOQUES, avisaQueEsAutomatico, normalizar, proximoToque, revisar, sinSeguimiento, ventanaAbierta,
} from "./frenos";
import { esCodigoSalir } from "./respuestas";

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const corto = (s, n = 280) => (String(s || "").length > n ? String(s).slice(0, n) + "…" : String(s || ""));
// El modelo empieza su aviso con "YA:" o con "HOY:" cuando la charla no puede esperar a la lista del día.
const esUrgente = (aviso) => /^(YA|HOY):/.test(aviso || "");

const HORA = 3600000;
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

/** Con una indicación de Cande solo se frena lo que no puede salir nunca: un mensaje de más del tope o pedir datos de pago. */
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
const ESPERA_INSTAGRAM_MS = 10000;

export function crearAgente({
  base, pedir, manychat, avisar, esperar = dormir, reloj = () => new Date(), instagram = null, esperaInstagramMs = ESPERA_INSTAGRAM_MS,
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
    try {
      salio = await avisar(conNombre, campos, opciones);
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
   * Un mensaje que llega por la entrada. Devuelve el id con el que quedó guardado, o null si no
   * se guardó nada: la charla es de Cande, es un reintento, o es alguien nuevo y no entró.
   *
   * Con las altas prendidas, quien nunca pasó por la base queda del agente. El aviso a Cande sale
   * recién en su primer turno, cuando el modelo dice si es un lead (ver procesar): a la entrada
   * también llegan amigos y charlas suyas, y Cande pidió (15/10) que a Telegram vayan solo los
   * leads. El tope de 24 horas es la red por si el filtro de ManyChat se rompe: cuando se llena se
   * le avisa. Con el agente apagado no entra nadie.
   */
  async function recibir(id, texto, nombre = null) {
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
   * Decide y ejecuta. `idDisparo` es el mensaje del lead que arrancó esta corrida.
   * `tarde`: el cron reintenta un mensaje que no se pudo contestar (la Mac sin red, el modelo caído).
   * Sin espera, y la respuesta sale por la API de ManyChat: el retiro del flujo ya pasó.
   */
  async function procesar(id, idDisparo, { evento = null, tarde = false, indicacion = "" } = {}) {
    // evento "seguimiento": un toque. evento "indicacion": Cande le respondió un aviso desde Telegram
    // con lo que quiere que le diga (lib/dm/respuestas.js); el agente le escribe al lead siguiéndola.
    const esToque = evento === "seguimiento";
    const esIndicacion = evento === "indicacion";
    await base.tablas();
    let aj = await base.ajustes();
    if (!prendido(aj)) return { hecho: "apagado" };
    if (esToque && aj.toques !== true) return { hecho: "toques apagados" };

    if (!evento) {
      if (!tarde) await esperar(aj.espera_ms);
      // Si mientras tanto llegó otro mensaje, contesta la corrida de ese mensaje.
      if ((await base.ultimoIdLead(id)) !== idDisparo) return { hecho: "llegó otro mensaje" };
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
      if ((await base.ultimoIdLead(id)) !== idDisparo) return { hecho: "llegó otro mensaje" };
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
    // reintentar: el modelo no contestó a un mensaje del lead. El turno queda abierto y la charla
    // sigue del agente: el cron la vuelve a intentar cuando la Mac contesta (y recién si pasan horas
    // se la pasa a Cande). Así un corte de red de la Mac no le saca charlas al agente.
    const fallar = async (e, hecho, { reintentar = false } = {}) => {
      try {
        if (idSalida) await base.marcarSalida(idSalida, "error", corto(e.message, 400));
        // Los fallos del cron quedan como "reintento": son los que cuentan para su tope (sinContestar),
        // no los de los mensajes que el lead sigue mandando mientras la Mac no está.
        else await base.guardarSalida({ contacto: id, accion: tarde ? "reintento" : "error", estado: "error", detalle: corto(e.message, 400) });
        if (!reintentar) await cerrarTurno();
      } catch {
        // con la base caída no queda constancia, pero el aviso sale igual
      }
      if (reintentar) return { hecho, error: e.message, reintento: true, transitorio: true, general: e?.general !== false };
      // Un toque que falla (la Mac dormida, el modelo que no contesta) no deja a nadie esperando:
      // queda anotado y la charla sigue del agente. Pasarla le sacaría al agente un lead sano.
      if (!evento) await pasarACande(c, { aviso: "el agente falló y no contestó nada", motivo: corto(e.message, 200), ultimo });
      return { hecho, error: e.message, transitorio: e?.transitorio === true, general: e?.general !== false };
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
      if (!evento && ultimoVisto !== idDisparo) return { hecho: "llegó otro mensaje" };
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
      const turno = armarTurno(mensajes, {
        evento, ahora: reloj(), ultimoLead, toque: c.toques, desde: desdeTurno,
        contexto: [c.contexto, notaTarde, esIndicacion ? notaIndicacion(indicacion) : null].filter(Boolean).join(" ") || null,
      });
      ultimo = turno.mensajes_del_lead.join(" / ") || charlaDelLead.at(-1) || "";
      // Sin mensajes nuevos y sin ser un seguimiento: mientras esta corrida esperaba, Cande anotó
      // su respuesta o volvió a darle la charla al agente. Un turno vacío el modelo lo lee como un
      // seguimiento, así que no se le pide nada.
      if (!evento && !turno.mensajes_del_lead.length) return { hecho: "ya estaba atendido" };
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

      const textoPrompt = (await base.prompt()).replaceAll("{LINK_DE_PAGO}", aj.link_de_pago || "(sin cargar)");
      if (!textoPrompt) throw new Error("no hay prompt cargado");

      // Un toque (y un reintento tarde) suelta la traba mientras se genera: si el lead escribe en ese
      // rato, la corrida de su mensaje tiene que poder arrancar ya (ManyChat retira la respuesta a
      // los ~50 segundos). Al volver la retoma; si la tiene esa corrida, o si el lead escribió, no sale.
      if (evento || tarde) await base.soltar(id, marca);
      let salida;
      try {
        salida = normalizar(await pedir({ prompt: textoPrompt, turno }));
      } catch (e) {
        // Solo lo que se arregla solo (la Mac sin red, Anthropic caído) se reintenta; un modelo que se
        // negó o devolvió algo ilegible no va a cambiar en el próximo intento: pasa a Cande.
        const reintentar = !evento && e?.transitorio === true;
        // Un reintento soltó la traba para generar: si mientras tanto escribió el lead u otra corrida
        // tomó la charla, el turno es de esa corrida y acá solo queda la constancia.
        if (tarde && !reintentar && ((await base.ultimoIdLead(id)) !== ultimoVisto || !(await base.tomar(id, marca)))) {
          await base.guardarSalida({ contacto: id, accion: "reintento", estado: "error", detalle: corto(e.message, 400) });
          return { hecho: "error del modelo", error: e.message, transitorio: false, general: e?.general !== false };
        }
        return await fallar(e, "error del modelo", { reintentar });
      }
      if ((evento || tarde) && !(await base.tomar(id, marca, opcionesTraba))) {
        await base.guardarSalida({
          contacto: id, accion: salida.accion, motivo: salida.motivo, estado: "descartada",
          detalle: "mientras se generaba, otra corrida tomó la charla",
        });
        return { hecho: "otra corrida lo tiene" };
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
        return { hecho: "llegó otro mensaje durante la generación" };
      }
      if ((evento || tarde) && (await charlaCambio())) {
        await base.guardarSalida({
          contacto: id, accion: salida.accion, motivo: salida.motivo, estado: "descartada",
          detalle: "mientras se generaba el toque, se escribió en la charla",
        });
        return { hecho: "la charla cambió durante la generación" };
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

      // Lo que pidió Cande lo decide ella: los frenos son para lo que redacta el agente solo (ella sí
      // puede ofrecer su tiempo o una fecha). Con la indicación solo cuidan el largo y los datos de pago.
      const freno = esIndicacion ? revisarIndicacion(salida) : revisar(salida, {
        textosDelLead: turno.mensajes_del_lead, charlaDelLead, estadoPrevio: c.estado, linkDePago: aj.link_de_pago,
        // El aviso de que es automático tiene que figurar en lo que salió de la cuenta, lo haya
        // mandado el agente o Cande con un borrador suyo. Con aviso_ia en false no se exige.
        exigirAviso: aj.aviso_ia !== false &&
          !todos.some((m) => (m.quien === "agente" || m.quien === "cande") && avisaQueEsAutomatico(m.texto)),
      });
      const texto = salida.mensajes.join(" / ");
      // Lo que el modelo quiere que Cande sepa aunque la charla siga siendo del agente.
      const avisoSuelto = async (mandado) => {
        // Solo lo urgente (HOY: / YA:). Las notas del modelo quedan guardadas con la salida (16/10: "me
        // explota el celular").
        if (!salida.aviso_para_cande || !esUrgente(salida.aviso_para_cande)) return;
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
      try {
        await base.soltar(id, marca);
      } catch {
        // la traba se libera sola a los 6 minutos
      }
    }
  }

  return { recibir, procesar, pasarACande };
}
