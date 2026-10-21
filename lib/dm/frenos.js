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
import { esLinkConId } from "./linkFormulario";
import { esCodigoSalir } from "./respuestas";

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
    r`\bcupos? limitados?\b`, r`\b(solo|unicamente) (por )?hoy\b`,
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

// "preventa" es urgencia solo si no la trajo el lead (20/10: era el trabajo de quien escribía, y nombrarla para
// preguntarle por eso no apura a nadie). Lo mismo en la revisión de la Mac (tracker/dm_revisor.py, PREVENTA).
const PREVENTA = /\bpre ?-?venta\b/;

/** Estos dos se miran en el texto tal cual sale. */
const SIGNOS = [[/[¿¡]/, "signo de apertura"], [/[—–]/, "guion largo"]];

/**
 * Los signos de apertura y el guion largo se arreglan solos antes de los frenos, en vez de frenar el mensaje (20/10):
 * se sacan los signos y el guion queda como una pausa con coma, igual que estilo.publicable en la Mac. Nunca agrega
 * nada. Un mensaje que era solo un guion queda vacío. SIGNOS sigue en revisar, por si algo llega sin pasar por acá.
 */
export function sinSignos(texto) {
  return String(texto ?? "")
    .replace(/[¿¡]/g, "")
    .replace(/^[ \t]*[—–][ \t]*/gm, "")
    .replace(/[ \t]*[—–][ \t]*(?=\n|$)/g, "")
    .replace(/[ \t]*[—–][ \t]*/g, ", ");
}

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
// El del formulario también sale con el id de la charla y su firma (?ig=<id>&f=<firma>, lib/dm/linkFormulario.js),
// y con nada más: el modelo lo puede copiar del historial. Eso lo mira esLinkConId.
const LINKS_PROPIOS = ["opengatehub.com/devs", "opengatehub.com/devs/gracias"];
const MONTOS =
  /(?:u\$s|us\$|usd|\$|€) ?(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?) ?(?:mil )?(?:dolar(?:es)?|usd|u\$s|us\$|\$|€|euros?|pesos|lucas)(?![a-z])/g;
const MONTOS_REALES = [27, 13.5];
// La garantía de 30 días es real (Gumroad la da y ella la dice en el video), y es lo que frena a los que
// llegan al final ("sirve de verdad?", Cande 20/10). Esa frase, y solo esa, no cuenta como promesa ni
// como devolución; cualquier otra forma de "garantía" o "te devuelvo" sigue frenada.
const GARANTIA_REAL = new RegExp(["garantia de 30 dias", "[,.:;]? ?(si no te sirve,? )?", "te devuelvo la plata"].join(""), "g");
const sinGarantia = (t) => t.replace(GARANTIA_REAL, " ");
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
// "spam" cuenta como siempre, menos negado ("no es spam", "ni spam") o hablando del spam de su mail ("me llegó al
// spam", "la carpeta de spam", "revisá el spam", "el spam del mail"): 20/10.
const BAJA = de(
  r`\bno me (escribas|escriban|mandes|manden|hables|contactes|molestes|jodas)\b|\bdeja(me)? de (escribir|mandar|molestar|joder)`,
  r`(?<!\b(no|ni) ((es|era|sos|soy|hago|hace|hacemos) )?)(?<!\b(carpeta|bandeja) de )(?<!\b(en|a|al|tengo el|revisa el|revisas el|mira el|miras el|revisar el|mirar el) )\bspam\b(?! (del?|en (el|mi|tu)|de (mi|tu)) (mail|correo|gmail|email|outlook|bandeja))`,
  r`\b(unsubscribe|darme de baja)\b|\bte (voy a )?(reporto|reportar|denuncio|denunciar|bloqueo|bloquear)\b`,
);
const DIJO_QUE_NO =
  /\bno me interesa\b|\bno (estoy|ando) interesad[oa]\b|\bno,? (muchas )?gracias\b|\b(por ahora|por el momento|de momento) no\b|\bno por (ahora|el momento)\b|\bpara (un|mas) (futuro|adelante)\b|\bprefiero (que )?no\b/;
const SENAL_EMPRESA = de(
  r`\b(tengo|tenemos|arme|armamos|funde|fundamos|cofunde|dirijo|manejo) (una|un|mi|nuestra|nuestro|la|el) (propia |propio |pequena |pequeno )?(empresa|agencia|startup|start up|consultora|software factory|pyme|negocio|emprendimiento)\b`,
  r`\b(mi|nuestra|nuestro) (propia |propio )?(startup|start up|agencia|consultora|software factory|pyme|negocio|emprendimiento|saas)\b`,
  r`\b(soy|somos) (el |la |un |una )?(founder|co-?founder|fundador|fundadora|cofundador|cofundadora|ceo|cto|coo|dueno|duena|socio|socia|recruiter|reclutador|reclutadora|headhunter|emprendedor|emprendedora|agencia|startup|consultora|software factory|pyme)\b`,
  // "construyendo", "lanzando" y "emprendiendo" no: los dispara la pregunta con la que arranca el agente, y casi
  // siempre es un portfolio o una app propia (20/10: 7 de 9 frenadas). Construir algo propio lo decide el prompt (freno 2).
  r`\b(estoy|estamos|ando|andamos|sigo) (contratando|reclutando)\b`,
  r`\b(estoy|estamos|ando|andamos) (buscando|necesitando) (contratar|sumar|a )?(un |una |unos |algun |mas )?(devs?|developers?|programador|programadora|programadores|desarrollador|desarrolladora|desarrolladores|freelancers?)\b`,
  r`(?<!\bno )\b(busco|buscamos|necesito|necesitamos|quiero|queremos|pienso|pensamos|voy a|vamos a|tengo que|tenemos que) (contratar|tercerizar|delegar|invertir en (un|el|mi) desarrollo|(un |una |unos |a un |a una |mas |algun )(devs?|developers?|programador|programadora|programadores|desarrollador|desarrolladora|desarrolladores|freelancers?)\b)`,
  // Presupuesto, cotización y asesoría cuentan como siempre, menos "no tengo presupuesto" (es plata: SIN_PLATA) y la
  // pregunta sobre Cande ("ofrecés alguna asesoría?"): 20/10.
  r`(?<!\b(no tengo|no tenemos|sin|no hay|poco|mucho) (el |un |mucho |tanto )?)\bpresupuestos?\b|\b(cotizacion|cotizar)\b`,
  // Tampoco la de ella dicha de otra forma: "tu asesoría", "el plan de asesoría que brindás" (21/10, un dev que preguntaba
  // por el programa).
  r`(?<!\b(ofreces|ofrecen|haces|hacen|das|dan|tenes|tienen|hay) (alguna |una |algun |un )?)(?<!\b(tu|tus|plan de|programa de) )\basesorias?\b(?! (que|q) (brindas|das|ofreces|haces|tenes|vendes))`,
  r`\bcuanto (cobras|cobran|me cobras|me sale|saldria|costaria) `,
  r`\b(para|en|de) mi (negocio|startup|emprendimiento|agencia)\b|\bmis clientes\b`,
  // "Ambas" no: contesta la pregunta con la que arranca el agente y casi siempre es un dev con un proyecto propio
  // (21/10: frenaba charlas que el agente podía seguir). Si contrata lo dice en el turno siguiente, y eso sí cuenta.
);
// Quien busca devs dicho de otra forma ("busco devs", "necesito 2 devs", "software house", "para mi equipo"). No frena
// nada (los frenos usan SENAL_EMPRESA): solo hace que lo frenado no tenga otra vuelta (agente.puedeReescribir), como en
// la revisión de la Mac (tracker/dm_revisor.py, SENAL_DE_CANDE "empresa"). Ante la duda, la charla pasa como antes.
const CONTRATA_DEVS = de(
  r`\b(busco|buscamos|necesito|necesitamos|estoy buscando|estamos buscando) (\d+ |un |una |unos |dos |tres )?(devs?|developers?|programador\w*|desarrollador\w*|freelancers?)\b`,
  r`\bsoftware house\b`, r`\b(para|en) (mi|nuestro) equipo\b`,
);

// Plata que ya se movió o un acceso que no llega (20/10, revisión del PR de los avisos): una devolución o un reembolso,
// un pago o una compra hecha, no poder entrar, el acceso, el código o el mail que no llegó, una factura, un cobro. Es de
// Cande: lo frenado no tiene otra vuelta (agente.puedeReescribir). Las mismas palabras mira la revisión de la Mac
// (tracker/dm_revisor.py, SENAL_DE_CANDE "pagos"): si cambian acá, cambiarlas allá.
const PAGOS = de(
  r`\b(devolv|devuelv|reembols|reintegr)`,
  r`\b(pague|compre|abone|transferi)\b`,
  r`\b(hice|realice|hicimos|realizamos) (el|la|un|una) (pago|compra|transferencia)\b`,
  r`\bno (puedo|pude|me deja|logro|consigo) (entrar|ingresar|acceder)\b`,
  r`\bno me (llego|llega|llegaron|llegan) (el |la |los |las |ningun |ninguna |ni )?(acceso|codigo|mail|correo|email|link|nada)\b`,
  r`\bfactur`, r`\bcobr(o|aron|aste|ado|ada|os)\b`, r`\bcomprobante`,
);

const MAX_MENSAJES = 3;
const MAX_LARGO = 350; // Instagram corta en 1.000; ella escribe mucho menos, y así no cabe recitar las reglas
export const MAX_TOQUES = 2;

const alguno = (patron, textos) => (textos || []).some((t) => patron.test(plano(t)));
/** Lo que el modelo dice de alguien que construye algo o contrata: es de Cande. */
export const esEmpresa = (quien) => quien === "construye" || quien === "empresa";
const esDev = (quien) => quien === "dev" || quien === "estudia";
/** Un link sin https, sin www y sin la puntuación que le quedó pegada, para compararlo. */
const sinEsquema = (u) =>
  plano(u).replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[.,;:!?)]+$/, "").replace(/\/+$/, "");

/**
 * Qué contó el lead en estos textos: crisis, sin plata, sin trabajo, pedido de baja, un no, señal de empresa, plata
 * que ya se movió o un acceso que no llega (pagos), y quien busca devs dicho de otra forma (contrataDevs: no frena
 * nada, lo usa solo la vuelta de más).
 */
export function senales(textos) {
  return {
    crisis: alguno(CRISIS, textos), sinPlata: alguno(SIN_PLATA, textos), sinTrabajo: alguno(SIN_TRABAJO, textos),
    baja: alguno(BAJA, textos), dijoQueNo: alguno(DIJO_QUE_NO, textos), empresa: alguno(SENAL_EMPRESA, textos),
    pagos: alguno(PAGOS, textos), contrataDevs: alguno(CONTRATA_DEVS, textos),
  };
}

/** Los motivos de los frenos que cuidan lo que es de Cande: empresas (las dos formas), un pedido de baja y una crisis. */
export const MOTIVO_EMPRESA = "lista, programa, llamada o precio a alguien que construye o contrata";
export const MOTIVO_SENAL_EMPRESA = "el lead dio una señal de empresa y le iba a pasar la lista, el programa o el precio";
export const MOTIVO_BAJA = "pidió que no le escriban";
export const MOTIVO_CRISIS = "iba a vender a alguien que contó una crisis";
/** Si lo frenó uno de estos, la charla es de Cande: pasa al toque, sin otra vuelta (agente.puedeReescribir). */
export const FRENOS_DE_CANDE = new Set([MOTIVO_EMPRESA, MOTIVO_SENAL_EMPRESA, MOTIVO_BAJA, MOTIVO_CRISIS]);

/** Este texto avisa que quien escribe es un automático? */
export const avisaQueEsAutomatico = (texto) => AVISO.test(plano(texto));

/**
 * Si el texto trae el código de acceso (suelto o adentro del link), sin importar mayúsculas ni tildes.
 * Sin código cargado, nunca.
 */
export function tieneCodigo(texto, codigo) {
  const c = plano(codigo).replace(/[^a-z0-9]/g, "");
  if (!c) return false;
  return new RegExp(`(?<![a-z0-9])${c}(?![a-z0-9])`).test(plano(texto));
}

/**
 * El freno del código de acceso de quien pagó en pesos (ajuste codigo_mercadopago). 19/10, Cande: el código sale
 * cuando ella responde ok, nunca solo. Lo que escribe el agente no lo lleva nunca: ni en una respuesta, ni en un
 * toque, ni en una respuesta tarde, ni siguiendo una indicación de Cande desde Telegram (ella puede pedirle "pasale
 * el código" respondiendo otro aviso). lib/dm/agente.js lo aplica a toda salida antes que cualquier otro freno.
 * Lo único que puede llevar el código es el borrador que Cande aprueba con ok y lo que ella escribe a mano con
 * /textual (lib/dm/respuestas.js), que no pasan por el agente.
 * Devuelve { ok: false, motivo } si alguno de los mensajes que saldrían lo trae, o null.
 */
export function frenoDelCodigo(salida, codigo) {
  if (salida?.accion === "callar") return null; // no sale nada
  const lleva = (salida?.mensajes || []).some((m) => tieneCodigo(m, codigo));
  return lleva ? { ok: false, motivo: "el código de acceso sale solo con el ok de Cande" } : null;
}

/** Lo que el modelo dice de un pago en pesos (pago_pesos en la Salida de lib/dm/modelo.js). Cualquier otra cosa es null. */
export const PAGOS_PESOS = ["comprobante", "dice", "dudoso"];

/**
 * Revisa lo que el modelo quiere mandar.
 * Devuelve { ok: true } o { ok: false, motivo } con la primera regla que rompe.
 *
 *   textosDelLead  lo que escribió en este turno
 *   charlaDelLead  todo lo que escribió en la charla: quien contó una crisis o que no tiene
 *                  plata sigue contándolo tres turnos después, y en un seguimiento el turno viene vacío
 *   estadoPrevio   lo que el modelo informó en el turno anterior: no alcanza con que hoy diga "dev"
 *   exigirAviso    todavía no se le dijo al lead que le escribe un automático
 *   contacto       el id de la charla: el link del formulario puede llevar ese id (?ig=, con o sin su &f=) y
 *                  ningún otro
 *
 * El código de acceso de quien pagó en pesos no se mira acá: lo mira frenoDelCodigo, que el agente aplica a todo
 * lo que escribe, también con una indicación de Cande (que no pasa por acá).
 */
export function revisar(salida, {
  textosDelLead = [], charlaDelLead = textosDelLead, estadoPrevio = null, linkDePago = "", otrosPagos = [], exigirAviso = false,
  contacto = null,
} = {}) {
  const mensajes = (salida.mensajes || []).map((m) => String(m || "").trim()).filter(Boolean);
  if (salida.accion === "callar") return { ok: true };
  if (salida.accion === "responder" && !mensajes.length) return { ok: false, motivo: "respuesta vacía" };
  if (mensajes.length > MAX_MENSAJES) return { ok: false, motivo: `más de ${MAX_MENSAJES} mensajes` };
  if (mensajes.some((m) => m.length > MAX_LARGO)) return { ok: false, motivo: "mensaje demasiado largo" };
  // "--" o "/yo" saliendo de la cuenta es el código de Cande para sacar al agente (lib/dm/instagram.js).
  if (mensajes.some(esCodigoSalir)) return { ok: false, motivo: "mensaje que es el código para sacar al agente" };

  const crudo = mensajes.join(" \n ");
  for (const [patron, motivo] of SIGNOS) {
    if (patron.test(crudo)) return { ok: false, motivo };
  }
  const todo = sinGarantia(plano(crudo));
  const preventaDelLead = alguno(PREVENTA, charlaDelLead);
  const conO = sinGarantia(planoConO(crudo));
  for (const [patron, motivo] of PROHIBIDO) {
    if (patron.test(conO)) return { ok: false, motivo };
  }
  if (!preventaDelLead && PREVENTA.test(conO)) return { ok: false, motivo: "urgencia que no es cierta" };
  if (INTERNO.test(todo)) return { ok: false, motivo: "nombra sus reglas o sus campos internos" };

  // Links, montos y regalos: solo los que existen.
  // Otros links de pago cargados en los ajustes (el de MercadoPago en pesos): valen como el de pago.
  const pagos = [linkDePago, ...otrosPagos].filter(Boolean).map(sinEsquema);
  const pago = pagos[0] || "";
  const permitidos = [...LINKS_PROPIOS, ...pagos];
  if ((todo.match(URLS) || []).map(sinEsquema).some((u) => !permitidos.includes(u) && !esLinkConId(u, contacto))) {
    return { ok: false, motivo: "link que no está en la lista permitida" };
  }
  for (const m of todo.matchAll(MONTOS)) {
    if (!MONTOS_REALES.includes(parseFloat((m[1] || m[2]).replace(",", ".")))) {
      return { ok: false, motivo: "monto que no es 27 ni 13,50" };
    }
  }
  if (REGALO.test(todo)) return { ok: false, motivo: "regalo, devolución o transferencia" };

  const quien = salida.estado?.quien;
  const vende = PRECIO.test(todo) || LINK_PAGO.test(todo) || LINK_VIDEO.test(todo) || pagos.some((p) => todo.includes(p));
  const pasaLista = LINK_DEVS.test(todo);
  const comercial = vende || pasaLista || PROGRAMA.test(todo);
  const lead = senales(charlaDelLead);

  // Pidió que no le escriban: sale una sola disculpa, y solo al pasarle la charla a Cande.
  if (lead.baja && mensajes.length && salida.accion !== "pasar_a_cande") {
    return { ok: false, motivo: MOTIVO_BAJA };
  }
  // Founders y empresas son de Cande: nunca la lista de devs, el programa, la llamada ni cuánto sale.
  // Vale lo que el modelo dice ahora, lo que dijo antes y lo que escribió el lead.
  if ((esEmpresa(quien) || esEmpresa(estadoPrevio?.quien)) && (comercial || LLAMADA.test(todo) || VIDEO.test(todo))) {
    return { ok: false, motivo: MOTIVO_EMPRESA };
  }
  if (lead.empresa && (comercial || LLAMADA.test(todo))) {
    return { ok: false, motivo: MOTIVO_SENAL_EMPRESA };
  }
  // Cuánto sale, el link de pago y el programa, solo a un dev.
  if (vende && !esDev(quien)) return { ok: false, motivo: "iba a decir cuánto sale sin saber que es dev" };
  if (PROGRAMA.test(todo) && !pasaLista && !esDev(quien)) {
    return { ok: false, motivo: "iba a hablar del programa sin saber que es dev" };
  }
  // Con una crisis en la charla no se vende nada. Sin plata o apurado, no se dice cuánto sale.
  if (lead.crisis && (comercial || VIDEO.test(todo))) {
    return { ok: false, motivo: MOTIVO_CRISIS };
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
 * pasa, no sale. `noAntesDe` corre la hora hacia adelante (el segundo toque, lejos del primero).
 */
export function proximoToque({ ahora, ultimoLead, horas, toquesHechos, maxToques = MAX_TOQUES, huso = -3, noAntesDe = null }) {
  if (!horas || horas <= 0 || !ultimoLead || toquesHechos >= maxToques) return null;
  const h = Math.min(Math.max(horas, 4), 23);
  let cuando = new Date(ultimoLead.getTime() + h * 3600000);
  if (noAntesDe && cuando < noAntesDe) cuando = new Date(noAntesDe.getTime());
  const horaLocal = (((cuando.getUTCHours() + cuando.getUTCMinutes() / 60 + huso) % 24) + 24) % 24;
  if (horaLocal >= 21) cuando = new Date(cuando.getTime() + (33 - horaLocal) * 3600000);
  else if (horaLocal < 9) cuando = new Date(cuando.getTime() + (9 - horaLocal) * 3600000);
  const cierre = new Date(ultimoLead.getTime() + 23.5 * 3600000);
  return cuando > ahora && cuando < cierre ? cuando : null;
}

/**
 * Es hora de mandar toques? Entre las 9 y las 21 de Argentina, como los agenda proximoToque, más 10
 * minutos de margen: el cron corre a los 0, 15, 30 y 45 de cada hora (lib/crons.js), así que uno
 * agendado a las 20:55 sale en la corrida de las 21, aunque arranque unos segundos tarde.
 */
export function horaDeToques(ahora, huso = -3) {
  const h = (((ahora.getUTCHours() + ahora.getUTCMinutes() / 60 + huso) % 24) + 24) % 24;
  return h >= 9 && h < 21 + 10 / 60;
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
    // Si avisó que pagó en pesos o mandó una foto que puede ser el comprobante (lib/dm/agente.js, avisarPago).
    pago_pesos: PAGOS_PESOS.includes(s.pago_pesos) ? s.pago_pesos : null,
  };
}
