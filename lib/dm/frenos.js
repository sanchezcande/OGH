// Frenos del agente de DM, en código.
//
// El modelo redacta; esto decide si lo que redactó puede salir. Lo que está acá no
// depende de que el modelo "se acuerde" de una regla: si se equivoca, el mensaje no sale
// y la charla pasa a ser de Cande.
//
// Son funciones puras (sin base ni red) para poder probarlas una por una.
//
// Casi todo se mira "en plano": sin tildes, sin mayúsculas y con los espacios juntados. En
// JavaScript \b no funciona pegado a una letra con tilde ni a un signo como $, así que una
// expresión escrita con tildes deja pasar justo las palabras que más importan.

/** El texto sin tildes ni mayúsculas y con los espacios juntados. */
export const plano = (s) =>
  String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

// En plano, un pasado en tercera persona queda igual que una promesa en primera: "te llamó"
// es "te llamo" y "te avisó" es "te aviso". Para las frases prohibidas se deja de pie la ó con
// que termina una palabra: "Y de esas alguna te llamó?" es una pregunta, no una promesa.
const MARCA = "\u0001";
const planoConO = (s) =>
  plano(String(s || "").normalize("NFC").replace(/ó(?![a-záéíóúüñ])/gi, MARCA)).replaceAll(MARCA, "ó");

const de = (...partes) => new RegExp(partes.join("|"));
const r = String.raw;

const DIA = "(lunes|martes|miercoles|jueves|viernes|sabado|domingo)";
const CUANDO =
  `(hoy|manana|luego|despues|mas tarde|pronto|a la (noche|tarde|manana)|en (un rato|unos dias|la semana|estos dias)` +
  `|esta semana|la semana que viene|el ${DIA}|el finde)`;
// "no te garantizo nada" es justo lo contrario de prometer: la negación de adelante lo salva.
const SIN_NEGAR = r`(?<!\b(no|ni|nunca|nadie|tampoco)( [a-z]+){0,3} )`;

/** Frases que no salen nunca, con el motivo que le llega a Cande. Se miran en plano, con la ó final de pie. */
const PROHIBIDO = [
  [de(
    r`(?<!\bno )\bsoy ((la )?cande|yo\b|real\b|humana?\b|una persona\b|de carne y hueso\b)`,
    r`\b(te habla|te escribe|aca|habla) cande\b`,
    r`\bno soy (un |una |ningun |ninguna )?(bot|robot|ia|ai|maquina|inteligencia artificial|automatic[oa])\b`,
    r`\bno (es|son|era|eran|hay) (un |una |ningun |ninguna |unos |mensajes? )?(bot|robot|ia|maquina|automatic[oa]s?)\b`,
    r`\bte agarr[oó] el bot\b`, r`\brecien (lo |la |te )?(veo|vi|leo|lei)\b`,
    r`\bdejame (ver|mirar|revisar|chequear|fijarme)`,
    r`\b(perdon|disculpa|disculpame|sorry) (por )?la demora\b`, r`\bestaba ocupada\b`,
  ), "dice o da a entender que es una persona"],
  [de(
    r`\ben ?seguid(a|ita)\b`, r`\blo (antes|mas (rapido|pronto)) (posible|que pueda)\b`, r`\bcuanto antes\b`,
    r`\b(en breve|a la brevedad|ya mismo|al toque|en un rato)\b`, r`\bpront(o|ito)\b`,
    r`\ben (pocos|unos|un par de|los proximos) dias\b`,
    r`\b(ni bien|apenas) (pueda|tenga|sepa|salga|haya|aparezca|vea)\b`,
    r`\b(conseguis|consigas|conseguir|quedar|resolves|resolver|resuelve|resuelvo|contesto|respondo|escribo|mando) (muy |bien |re |mas |super )?rapido\b`,
  ), "promete un plazo"],
  [de(
    // "te aviso que..." es como arranca el aviso de que es automático: eso sí sale.
    r`\b(te|les?) (voy a |vamos a |estare |estaremos )?avis(o|ar|are|amos|ando)\b(?! que\b)`,
    r`\bcualquier (cosa|novedad) te (aviso|escribo|cuento)\b`, r`\bte (mantengo|tengo) al tanto\b`,
    r`\bsi (surge|sale|aparece|entra|llega) (algo|alguna (vacante|busqueda)|una (vacante|busqueda|oportunidad))( [a-z]+){0,4} te (escribo|aviso|cuento|contacto|llamo|digo)\b`,
    r`\bte (escribo|cuento|contacto|llamo|digo) (si|cuando|apenas|ni bien) (surge|sale|aparece|entra|llega|hay|haya|surja|salga|aparezca|tenga)\b`,
    r`\b(si|cuando) (surge|surja|sale|salga) algo\b`,
    r`\bquedas (en (mi|el) radar|adentro)\b`,
    r`\bte (tengo|tendre|voy a tener|vamos a tener|tenemos) (en cuenta|en mente|presente|en (mi|el) radar)\b`,
    // Pasadas las 24 horas no se puede escribir: prometer algo para después no se puede cumplir.
    r`\b(te|nos|lo|la) (escribo|contacto|llamo|hablo|hablamos|vemos|veo|reviso|comunicamos|contesto|respondo|cuento|digo|confirmo|mando|paso) ${CUANDO}\b`,
    // Con algo en el medio ("te paso el link mañana"), que es el orden más común.
    r`\b(te|nos|lo|la) (escribo|contacto|llamo|hablo|hablamos|vemos|veo|reviso|comunicamos|contesto|respondo|cuento|digo|confirmo|mando|paso)( [a-z]+){1,3} ${CUANDO}\b`,
    r`\b${CUANDO} (te|lo|la|nos) (escribo|contacto|llamo|cuento|aviso|digo|contesto|respondo|confirmo|vemos|veo|reviso|mando|paso)\b`,
    r`\bte vuelvo a escribir\b`, r`\bhablamos manana\b`, r`\bte llamo\b`, r`\bbusquedas abiertas\b`,
  ), "promete avisar o escribir después"],
  [de(
    r`\bte consigo\b`, r`\bvas a conseguir`, r`\bvas a quedar\b`,
    r`\bvas a (encontrar|tener|lograr|recibir) ((un|una|tu|el|mas|mejores|muchas|nuevas) )*(trabajo|laburo|empleo|puesto|entrevistas?|ofertas?|propuestas?|chances|oportunidades|llamados)\b`,
    r`\bte van a (llamar|contratar|contactar|escribir|responder|contestar)\b`, r`\bmas chances\b`,
    r`\b(seguro|con esto|asi) (que )?(conseguis|quedas|te llaman|entras)\b`,
    SIN_NEGAR + r`\b(te (lo )?(garantizo|aseguro)|garantiz[a-z]*|garantia|asegurad[oa]s?)\b`,
    r`\bte (ubico|coloco|presento)\b`, r`\bte ayudo a (conseguir|encontrar)\b`,
    r`\b(tengo|hay|tenemos) (una |unas |varias |algunas )?(vacantes?|busquedas?|puestos?) (para vos|para tu perfil|abiert[oa]s?)\b`,
  ), "promete un resultado"],
  [de(
    r`\bultim[oa]s? (cupos?|lugares?|oportunidad(es)?|chance)\b`,
    // "en los últimos días" es una pregunta normal; "últimos días" a secas es apurar.
    r`(?<!\b(en|de|durante) (los|las) )\bultim[oa]s? (dias?|horas?)\b`,
    r`\b(quedan?|hay) (pocos|poquitos|solo \d+|\d+) (cupos|lugares|dias|horas)\b`, r`\bquedan pocos\b`,
    r`\bcupos? limitados?\b`, r`\bpre ?-?venta\b`, r`\b(solo|unicamente) (por )?hoy\b`,
    r`\bse (termina|acaba|cierra) (hoy|manana|pronto|ya|esta semana|el [a-z]+|en \d+)\b`,
    r`\b(la oferta|el precio|la promo|el lanzamiento|la inscripcion)( de lanzamiento)? (se )?(termina|acaba|cierra|sube|aumenta)\b`,
    r`\b(sube|aumenta|va a (subir|aumentar)|subira|aumentara|antes de que (suba|aumente)|despues sale mas)\b`,
    r`\btiempo limitado\b`, r`\b(descuento|rebaja|cupon|promo)\b`, r`\ben (oferta|promocion)\b`,
    r`\boferta (especial|limitada|de lanzamiento)\b`, r`\baprovecha (ahora|hoy|ya|el precio|que esta)\b`,
    r`\bhasta (hoy|manana|el [a-z0-9]+)\b[^?!]{0,30}\b(27|13[,.]50?)\b`,
    r`\b(27|13[,.]50?)\b[^?!]{0,40}\bhasta (hoy|manana|el [a-z0-9]+)\b`,
    // "por ahora" insinúa que después cambia. Solo sale pegado al monto, que es como lo dice Cande.
    r`\bpor ahora\b(?! esta en 27\b)`,
  ), "urgencia que no es cierta"],
  [de(
    r`\b(numero|nro|datos|foto|codigo|clave|vencimiento) de (la |tu |su )?tarjeta\b`, r`\b(cvv|cvc|cbu|cvu)\b`,
    r`\bcomprobantes?\b`, r`\b(captura|foto|screenshot|pantallazo) (del?|de la) (pago|transferencia|compra)\b`,
    r`\b(pasame|mandame|enviame|decime) (tu|el|los) (alias|datos bancarios|numero de cuenta)\b`,
  ), "pide datos de pago por chat"],
];

/** Estos dos se miran en el texto tal cual sale. */
const SIGNOS = [[/[¿¡]/, "signo de apertura"], [/[—–]/, "guion largo"]];

// Un 27 que cuenta otra cosa ("27 años", "27 entrevistas") no es plata.
const NO_ES_PLATA =
  "anos?|meses|dias|semanas|horas|cvs?|curriculums?|entrevistas?|postulaciones|aplicaciones|empresas|procesos|veces" +
  "|personas|devs?|ofertas|mails?|mensajes|respuestas|rechazos" +
  "|de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)";
const MONEDA = r`dolar(es)?|usd|us\$|u\$[sd]|euros?|eur|mangos|verdes|pavos|lucas`;
const PRECIO = de(
  r`(?<![a-z0-9])27(?![0-9])(?! ?(${NO_ES_PLATA})\b)`, r`\bveintisiete\b`,
  r`(?<![0-9])13[,.]50?(?![0-9])`, r`\btrece con cincuenta\b`,
  r`\b\d+([.,]\d+)? ?(${MONEDA})(?![a-z0-9])`, r`(\$|usd|us\$|u\$[sd]|€) ?\d+`,
  r`\b(sale|cuesta|vale|pagas|pagar|abonas?|cobro)\b[^?!]{0,25}\b(dolar(es)?|usd|euros?)\b`,
  r`\b(dos|2|tres|3) +(pagos|cuotas|partes)\b`, r`\bcuotas\b`,
  r`\bbarat[oa]\b`, r`\bprecio\b`, r`\blink (de|para) (pago|pagar|compra|comprar)\b`,
  r`\b(comprarlo|pagarlo|lo compras|lo pagas)\b`,
);
const LINK_PAGO = /get ?\. ?opengatehub|gumroad/;
const LINK_VIDEO = /opengatehub ?\. ?com ?\/ ?devs ?\/ ?gracias|\bpagina del video\b/;
const LINK_DEVS = /opengatehub ?\. ?com ?\/ ?devs/;
const LLAMADA =
  /strategy ?\. ?opengatehub|calendly|\bagend(a|ar|emos|as|o|amos)\b|\b(una|la|tu) (llamada|call|videollamada|reunion)\b/;
const PROGRAMA = /\b(mi|el|del|al|un|este|ese|tu) (programa|curso)\b|\bprograma (es )?pago\b/;
const VIDEO = /\bvideo\b/;

// Lo que el agente no puede ofrecer por su cuenta, sea quien sea el lead.
const URLS =
  /(?:https?:\/\/|www\.)[^\s]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|io|co|ly|me|link|app|org|ar|es|mx|cl|gg|to|xyz|site|page|shop|store)\b(?:\/[^\s]*)?/g;
const LINKS_PROPIOS = ["opengatehub.com/devs", "opengatehub.com/devs/gracias"];
const MONTOS =
  /(?:u\$s|us\$|usd|\$|€) ?(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?) ?(?:mil )?(?:dolar(?:es)?|usd|u\$s|us\$|\$|€|euros?|pesos|lucas)(?![a-z])/g;
const MONTOS_REALES = [27, 13.5];
const REGALO =
  /\bte lo regalo\b|\bde regalo\b|\b(para vos|te sale|te queda) gratis\b|\bsin (cargo|costo)\b|\bte devuelvo\b|\breembols|\btransferencia\b/;
// Si el modelo empieza a recitar sus reglas, aparecen los nombres de sus campos y de sus pasos.
// También lo que el prompt trae en el lugar del link de pago cuando no hay ninguno cargado.
const INTERNO =
  /pasar_a_cande|aviso_para_cande|seguimiento_en_horas|mensajes_del_lead|\bfreno \d|(?<!\b(te|les?) )\bpaso \d|\(sin cargar\)|link_de_pago/;
const AVISO = /\b(automatic[oa]s?|una ia|mi ia)\b/;

// Lo que contó el lead. Estas se miran en lo que escribió él, no en lo que redacta el agente.
const CRISIS = de(
  r`\bfalleci(o|eron|miento)?\b`, r`\b(se )?muri(o|eron)\b`,
  r`\bestoy de duelo\b|\b(en|un|el|mi) duelo\b(?! (de|con) (mi|el|la) (stack|lenguaje|framework|carrera))`,
  r`\bdepresion\b`, r`\bdeprimid[oa]\b`, r`\b(re|muy|medio) depre\b`,
  // La ansiedad de las entrevistas es un dolor de la búsqueda, no una crisis.
  r`(?<!\b(entrevistas?|busqueda|proceso|tecnicas?)[^.!?]{0,30})\bansiedad\b(?![^.!?]{0,30}\b(entrevistas?|busqueda|proceso|tecnicas?|live coding|buscar|postular))`,
  r`\bataques? de (panico|ansiedad)\b`, r`\bno (doy|puedo|aguanto) mas\b`, r`\bno quiero vivir\b`,
  r`\bme quiero (morir|matar)\b`, r`\bmatarme\b`, r`\bsuicid`, r`\bhacerme dano\b`,
  r`\bcrisis\b(?! (del?|en el|en la|de la|de los|que hay en( el| la)?) (sector|mercado|rubro|industria|it|tech|pais|juniors?|economia|software|trabajo)| economica| mundial| global| laboral)`,
  r`\b(internad[oa]|cancer|quimio|terapia intensiva)\b`, r`\bme (separe|divorcie)\b`, r`\bviolencia\b`,
  r`\bno tengo (ni )?(para|donde|que) (vivir|comer)\b`, r`\b(ahogad[oa]|tapad[oa]) (de|con|en) (deudas|cuentas)\b`,
);
const SIN_PLATA = de(
  r`\bno tengo (la |el |nada de |mucha |mucho |ni un |un |ni |como |con que )?(plata|dinero|guita|peso|mango|centavo|efectivo|fondos|recursos|presupuesto|ingresos|pagar|\$)(?![a-z0-9])`,
  r`\b(sin|cort[oa] de|just[oa] de) (plata|dinero|guita|un peso|un mango|ingresos|efectivo)\b`,
  r`\bno (me )?alcanza (la plata|el dinero|la guita|el sueldo|para (pagar|comprar|eso|el programa|vivir|comer|nada))\b`,
  r`^(no,? )?no (me )?alcanza\W*$`,
  r`\bno llego (a fin de mes|con (la plata|el dinero|los gastos|las cuentas)|a (pagar|cubrir|juntar))\b`,
  r`\bno (lo |la )?puedo (pagar|costear|comprar|permitir)`, r`\b(deudas?|endeudad[oa])\b(?! tecnicas?)`,
  r`\bdebo \d+ (meses|cuotas)\b`,
  r`(?<!\b(no|sin|tampoco)( [a-z]+){0,2} )\b(apurad[oa]|urgente|urgencia)\b`,
  r`\bnecesito (trabajar|laburar|plata|un ingreso|trabajo|laburo) (ya|urgente|si o si)\b`,
);
const SIN_TRABAJO =
  /\b(desemplead[oa]|desocupad[oa])\b|\bsin (trabajo|laburo|empleo)\b|\bme (echaron|despidieron|desvincularon|rajaron)\b|\bme quede sin (trabajo|laburo|empleo)\b/;
const BAJA =
  /\bno me (escribas|escriban|mandes|manden|hables|contactes|molestes|jodas)\b|\bdeja(me)? de (escribir|mandar|molestar|joder)|\b(spam|unsubscribe|darme de baja)\b|\bte (voy a )?(reporto|reportar|denuncio|denunciar|bloqueo|bloquear)\b/;
const DIJO_QUE_NO =
  /\bno me interesa\b|\bno (estoy|ando) interesad[oa]\b|\bno,? (muchas )?gracias\b|\b(por ahora|por el momento|de momento) no\b|\bno por (ahora|el momento)\b|\bpara (un|mas) (futuro|adelante)\b|\bprefiero (que )?no\b/;
const SENAL_EMPRESA = de(
  r`\b(tengo|tenemos|arme|armamos|funde|fundamos|cofunde|dirijo|manejo) (una|un|mi|nuestra|nuestro|la|el) (propia |propio |pequena |pequeno )?(empresa|agencia|startup|start up|consultora|software factory|pyme|negocio|emprendimiento)\b`,
  r`\b(mi|nuestra|nuestro) (propia |propio )?(startup|start up|agencia|consultora|software factory|pyme|negocio|emprendimiento|saas)\b`,
  r`\b(soy|somos) (el |la |un |una )?(founder|co-?founder|fundador|fundadora|cofundador|cofundadora|ceo|cto|coo|dueno|duena|socio|socia|recruiter|reclutador|reclutadora|headhunter|emprendedor|emprendedora|agencia|startup|consultora|software factory|pyme)\b`,
  r`\b(estoy|estamos|ando|andamos|sigo) (construyendo|lanzando|contratando|emprendiendo|reclutando)\b`,
  r`\b(estoy|estamos|ando|andamos) (buscando|necesitando) (contratar|sumar|a )?(un |una |unos |algun |mas )?(devs?|developers?|programador|programadora|programadores|desarrollador|desarrolladora|desarrolladores|freelancers?)\b`,
  r`(?<!\bno )\b(busco|buscamos|necesito|necesitamos|quiero|queremos|pienso|pensamos|voy a|vamos a|tengo que|tenemos que) (contratar|tercerizar|delegar|invertir en (un|el|mi) desarrollo|(un |una |unos |a un |a una |mas |algun )(devs?|developers?|programador|programadora|programadores|desarrollador|desarrolladora|desarrolladores|freelancers?)\b)`,
  r`\b(presupuesto|cotizacion|cotizar|asesorias?)\b`, r`\bcuanto (cobras|cobran|me cobras|me sale|saldria|costaria) `,
  r`\b(para|en|de) mi (negocio|startup|emprendimiento|agencia)\b|\bmis clientes\b`, r`\b(ambas?|ambos|las dos cosas)\b`,
);

const MAX_MENSAJES = 3;
const MAX_LARGO = 350; // Instagram corta en 1.000; ella escribe mucho menos, y así no cabe recitar las reglas
export const MAX_TOQUES = 2;

const alguno = (patron, textos) => (textos || []).some((t) => patron.test(plano(t)));
const esEmpresa = (quien) => quien === "construye" || quien === "empresa";
const esDev = (quien) => quien === "dev" || quien === "estudia";
/** Un link sin https, sin www y sin la puntuación que le quedó pegada, para compararlo. */
const sinEsquema = (u) =>
  plano(u).replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[.,;:!?)]+$/, "").replace(/\/+$/, "");

/** Qué contó el lead en estos textos: crisis, sin plata, sin trabajo, pedido de baja, un no, señal de empresa. */
export function senales(textos) {
  return {
    crisis: alguno(CRISIS, textos), sinPlata: alguno(SIN_PLATA, textos), sinTrabajo: alguno(SIN_TRABAJO, textos),
    baja: alguno(BAJA, textos), dijoQueNo: alguno(DIJO_QUE_NO, textos), empresa: alguno(SENAL_EMPRESA, textos),
  };
}

/** Este texto avisa que quien escribe es un automático? */
export const avisaQueEsAutomatico = (texto) => AVISO.test(plano(texto));

/**
 * Revisa lo que el modelo quiere mandar.
 * Devuelve { ok: true } o { ok: false, motivo } con la primera regla que rompe.
 *
 *   textosDelLead  lo que escribió en este turno
 *   charlaDelLead  todo lo que escribió en la charla: quien contó una crisis o que no tiene
 *                  plata sigue contándolo tres turnos después, y en un seguimiento el turno viene vacío
 *   estadoPrevio   lo que el modelo informó en el turno anterior: no alcanza con que hoy diga "dev"
 *   exigirAviso    todavía no se le dijo al lead que le escribe un automático
 */
export function revisar(salida, {
  textosDelLead = [], charlaDelLead = textosDelLead, estadoPrevio = null, linkDePago = "", exigirAviso = false,
} = {}) {
  const mensajes = (salida.mensajes || []).map((m) => String(m || "").trim()).filter(Boolean);
  if (salida.accion === "callar") return { ok: true };
  if (salida.accion === "responder" && !mensajes.length) return { ok: false, motivo: "respuesta vacía" };
  if (mensajes.length > MAX_MENSAJES) return { ok: false, motivo: `más de ${MAX_MENSAJES} mensajes` };
  if (mensajes.some((m) => m.length > MAX_LARGO)) return { ok: false, motivo: "mensaje demasiado largo" };

  const crudo = mensajes.join(" \n ");
  for (const [patron, motivo] of SIGNOS) {
    if (patron.test(crudo)) return { ok: false, motivo };
  }
  const todo = plano(crudo);
  const conO = planoConO(crudo);
  for (const [patron, motivo] of PROHIBIDO) {
    if (patron.test(conO)) return { ok: false, motivo };
  }
  if (INTERNO.test(todo)) return { ok: false, motivo: "nombra sus reglas o sus campos internos" };

  // Links, montos y regalos: solo los que existen.
  const pago = linkDePago ? sinEsquema(linkDePago) : "";
  const permitidos = [...LINKS_PROPIOS, pago].filter(Boolean);
  if ((todo.match(URLS) || []).map(sinEsquema).some((u) => !permitidos.includes(u))) {
    return { ok: false, motivo: "link que no está en la lista permitida" };
  }
  for (const m of todo.matchAll(MONTOS)) {
    if (!MONTOS_REALES.includes(parseFloat((m[1] || m[2]).replace(",", ".")))) {
      return { ok: false, motivo: "monto que no es 27 ni 13,50" };
    }
  }
  if (REGALO.test(todo)) return { ok: false, motivo: "regalo, devolución o transferencia" };

  const quien = salida.estado?.quien;
  const vende = PRECIO.test(todo) || LINK_PAGO.test(todo) || LINK_VIDEO.test(todo) || Boolean(pago && todo.includes(pago));
  const pasaLista = LINK_DEVS.test(todo);
  const comercial = vende || pasaLista || PROGRAMA.test(todo);
  const lead = senales(charlaDelLead);

  // Pidió que no le escriban: sale una sola disculpa, y solo al pasarle la charla a Cande.
  if (lead.baja && mensajes.length && salida.accion !== "pasar_a_cande") {
    return { ok: false, motivo: "pidió que no le escriban" };
  }
  // Founders y empresas son de Cande: nunca la lista de devs, el programa, la llamada ni cuánto sale.
  // Vale lo que el modelo dice ahora, lo que dijo antes y lo que escribió el lead.
  if ((esEmpresa(quien) || esEmpresa(estadoPrevio?.quien)) && (comercial || LLAMADA.test(todo) || VIDEO.test(todo))) {
    return { ok: false, motivo: "lista, programa, llamada o precio a alguien que construye o contrata" };
  }
  if (lead.empresa && (comercial || LLAMADA.test(todo))) {
    return { ok: false, motivo: "el lead dio una señal de empresa y le iba a pasar la lista, el programa o el precio" };
  }
  // Cuánto sale, el link de pago y el programa, solo a un dev.
  if (vende && !esDev(quien)) return { ok: false, motivo: "iba a decir cuánto sale sin saber que es dev" };
  if (PROGRAMA.test(todo) && !pasaLista && !esDev(quien)) {
    return { ok: false, motivo: "iba a hablar del programa sin saber que es dev" };
  }
  // Con una crisis en la charla no se vende nada. Sin plata o apurado, no se dice cuánto sale.
  if (lead.crisis && (comercial || VIDEO.test(todo))) {
    return { ok: false, motivo: "iba a vender a alguien que contó una crisis" };
  }
  if (lead.sinPlata && vende) {
    return { ok: false, motivo: "iba a decir cuánto sale a alguien que contó que no tiene plata o está apurado" };
  }
  if (senales(textosDelLead).sinTrabajo && vende) {
    return { ok: false, motivo: "iba a decir cuánto sale en el turno en que contó que está sin trabajo" };
  }
  // Va al final: si además rompe otra regla, a Cande le llega ese motivo, que es el que importa.
  if (exigirAviso && mensajes.length && !AVISO.test(todo)) {
    return { ok: false, motivo: "primer mensaje sin avisar que es automático" };
  }
  return { ok: true };
}

/**
 * A este lead no se le hace seguimiento? No se insiste con quien dijo que no, pidió que no le
 * escriban, frenó por plata, contó una crisis, no busca o tiene la charla cerrada. Que el modelo
 * devuelva un número de horas no alcanza para escribirle a alguien que pidió que no.
 */
export function sinSeguimiento({ estado, charlaDelLead = [], ultimoTurnoDelLead = [] }) {
  const e = estado || {};
  if (["cerrada", "de_cande"].includes(e.etapa) || e.busca === "no") return true;
  if (!e.link_formulario_enviado && e.busca !== "si") return true;
  if (senales(ultimoTurnoDelLead).dijoQueNo) return true;
  const lead = senales(charlaDelLead);
  return lead.baja || lead.sinPlata || lead.crisis;
}

/**
 * Cuándo puede salir el próximo toque de seguimiento. Devuelve una fecha o null.
 *
 * Las horas se cuentan desde el último mensaje del lead (así se las pide el prompt al modelo),
 * nunca menos de 4. Sale entre las 9 y las 21 (hora de Argentina, que es de donde escribe la
 * mayoría): lo que cae de noche se corre a las 9. Automático solo dentro de las 24 horas del
 * último mensaje del lead (regla de Instagram), con media hora de margen: si al correrlo se
 * pasa, no sale.
 */
export function proximoToque({ ahora, ultimoLead, horas, toquesHechos, maxToques = MAX_TOQUES, huso = -3 }) {
  if (!horas || horas <= 0 || !ultimoLead || toquesHechos >= maxToques) return null;
  const h = Math.min(Math.max(horas, 4), 23);
  let cuando = new Date(ultimoLead.getTime() + h * 3600000);
  const horaLocal = (((cuando.getUTCHours() + cuando.getUTCMinutes() / 60 + huso) % 24) + 24) % 24;
  if (horaLocal >= 21) cuando = new Date(cuando.getTime() + (33 - horaLocal) * 3600000);
  else if (horaLocal < 9) cuando = new Date(cuando.getTime() + (9 - horaLocal) * 3600000);
  const cierre = new Date(ultimoLead.getTime() + 23.5 * 3600000);
  return cuando > ahora && cuando < cierre ? cuando : null;
}

/** Es hora de mandar toques? Entre las 9 y las 21 de Argentina, como los agenda proximoToque. */
export function horaDeToques(ahora, huso = -3) {
  const h = (((ahora.getUTCHours() + ahora.getUTCMinutes() / 60 + huso) % 24) + 24) % 24;
  return h >= 9 && h < 21;
}

/** Sigue abierta la ventana de 24 horas para escribirle a este contacto? */
export const ventanaAbierta = (ahora, ultimoLead) =>
  Boolean(ultimoLead) && ahora.getTime() - ultimoLead.getTime() < 23.5 * 3600000;

/** Deja la salida del modelo en un formato seguro, sin campos de más ni tipos raros. */
export function normalizar(salida) {
  const s = salida || {};
  const accion = ["responder", "callar", "pasar_a_cande"].includes(s.accion) ? s.accion : "pasar_a_cande";
  return {
    accion,
    mensajes: (Array.isArray(s.mensajes) ? s.mensajes : []).map((m) => String(m || "").trim()).filter(Boolean),
    estado: s.estado && typeof s.estado === "object" ? s.estado : {},
    // Con tope: el aviso sale por Telegram, que rechaza un mensaje de más de 4.096 caracteres.
    aviso_para_cande: String(s.aviso_para_cande || "").slice(0, 600),
    seguimiento_en_horas: typeof s.seguimiento_en_horas === "number" ? s.seguimiento_en_horas : null,
    motivo: String(s.motivo || "").slice(0, 300),
  };
}
