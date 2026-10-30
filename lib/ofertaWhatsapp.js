// El mensaje para ofrecerle el acompañamiento 1 a 1 a quien acaba de comprar el curso.
//
// Hooman, 28/10: la oferta tiene que llegar DESPUÉS de que pagó los 27, y a mano. El upsell de
// Gumroad salta cuando aprietan "Pay", antes del pago, así que se pausó. Cande, 29/10: "hagamos
// eso de Telegram, que me llegue con el link que abra wpp". El aviso de la venta trae un botón que
// abre WhatsApp con este mensaje ya escrito; lo manda ella, y lo puede cambiar antes de mandarlo.
//
// Sin imports a propósito: lo usa pages/api/gumroad-ping.js y se prueba con node solo.

/** La agenda del 1 a 1. Es nuestra y no la de Google: cuenta los clicks (ver pages/llamada.js). */
export const LINK_LLAMADA = "https://www.opengatehub.com/llamada";

/** El detalle de la oferta (Google Doc de Cande). El link de pago va después, cuando dice que sí. */
export const DOC_OFERTA = "https://docs.google.com/document/d/16OGpF3zBge4MKWxPW12FGJUdU7XMBmcQ-2zzfVahy2I/edit";

/** Lo que se pone si la venta se pagó en pesos (código de MercadoPago canjeado en Gumroad). */
export const PAGO_EN_PESOS = "pagó en pesos";

/** El nombre de pila, como lo escribiría ella: "andres caleb" → "Andres". Un mail no es un nombre. */
export function primerNombre(nombre) {
  const p = String(nombre || "").trim().split(/\s+/)[0] || "";
  if (!p || p.includes("@")) return "";
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
}

/** El WhatsApp que se le manda. Mismo marco que pidió Hooman: "busco 5 devs", nunca "tomo" ni "nosotros". */
export function mensajeOferta(nombre) {
  const pila = primerNombre(nombre);
  return `Che${pila ? ` ${pila}` : ""}, buenas! Gracias por sumarte al curso. Te cuento algo: estoy buscando 5 devs para ayudarlos a conseguir trabajo este mes, acompañándolos yo 1 a 1. Vas a ser vos o alguien más?\n\nTe dejo el detalle acá: ${DOC_OFERTA}`;
}

// Código de país por nombre, para los números que se anotaron sin "+" (69 de 522 en la red de
// devs al 29/10 vienen así, en formato local). Sin el código, wa.me abre un chat con otra persona.
const PAISES = [
  ["argentina", "54"], ["mexico", "52"], ["colombia", "57"], ["peru", "51"], ["chile", "56"],
  ["uruguay", "598"], ["paraguay", "595"], ["bolivia", "591"], ["ecuador", "593"], ["venezuela", "58"],
  ["costa rica", "506"], ["panama", "507"], ["guatemala", "502"], ["honduras", "504"], ["el salvador", "503"],
  ["nicaragua", "505"], ["cuba", "53"], ["republica dominicana", "1"], ["puerto rico", "1"],
  ["espana", "34"], ["estados unidos", "1"], ["usa", "1"], ["canada", "1"], ["brasil", "55"], ["brazil", "55"],
];

const sinTildes = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** El código del país que escribió en el formulario ("Concepción del Uruguay, Argentina" es Argentina). */
export function codigoPais(pais) {
  const t = sinTildes(pais);
  if (!t) return null;
  // Primero un tramo que sea justo el país: así la ciudad "Concepción del Uruguay" no gana.
  const tramos = t.split(/[,;:()/\-]+/).map((x) => x.trim()).filter(Boolean);
  for (const [nombre, codigo] of PAISES) if (tramos.includes(nombre)) return codigo;
  // Después, como palabra suelta: "usa" no puede ganar por estar adentro de "Usaquén".
  for (const [nombre, codigo] of PAISES) if (new RegExp(`\\b${nombre}\\b`).test(t)) return codigo;
  return null;
}

// Los códigos de la lista, para reconocer un número que ya viene en formato internacional. El 1 (Estados
// Unidos, Canadá, el Caribe) solo cuenta con 11 dígitos: "+1123485638" es un número de CABA con un "+" de más.
const CODIGOS = [...new Set(PAISES.map(([, c]) => c))];
const traeCodigo = (d) => CODIGOS.some((c) => d.startsWith(c) && (c !== "1" || d.length === 11));

/** "351 15 1234567" → "3511234567": el 15 de los celulares argentinos escritos como se marcan adentro del país.
 *  Va después de la característica (11, o de 3 o 4 dígitos); si se puede leer de dos maneras, no se adivina. */
function sinQuince(r) {
  const donde = [2, 3, 4].filter((n) => r.slice(n, n + 2) === "15" && (n === 2 ? r.startsWith("11") : /^[23]/.test(r)));
  return donde.length === 1 ? r.slice(0, donde[0]) + r.slice(donde[0] + 2) : null;
}

/**
 * El número tal como lo pide wa.me (solo dígitos, con código de país), o null si no se puede
 * armar uno confiable. Lo que vino del formulario es texto libre: "+54 9 11 ...", "3001234567",
 * "0351 15 1234567", dos números separados por "/", "N/A". Un número mal armado no falla: abre el
 * chat de un extraño (la revisión del 29/10 encontró "+3221234567" de Bogotá yendo a un fijo de
 * Bruselas). Ante la duda, null, y el aviso trae el texto para mandarlo por otro lado.
 */
export function numeroWhatsapp(crudo, pais) {
  const primero = String(crudo || "").split(/[\/,;]| o /)[0].trim();
  let d = primero.replace(/\D/g, "");
  if (!d) return null;
  const conMas = primero.startsWith("+");
  // Con "+" se respeta como vino, salvo que sea un número local con un "+" adelante: empieza con 0
  // ("+0412...") o es corto y no arranca con ningún código conocido ("+3221234567").
  if (!(conMas && !d.startsWith("0") && (d.length > 10 || traeCodigo(d)))) {
    d = d.replace(/^0+/, "");
    const cod = codigoPais(pais);
    if (cod) {
      // Ya trae el código (lo escribió sin el "+"): no se lo agrega dos veces.
      if (!(d.startsWith(cod) && d.length - cod.length >= 8)) d = cod + d;
    } else if (conMas || d.length < 11) {
      return null;   // local y sin país: no hay forma de saber a quién le escribiría
    }
  }
  // Argentina: WhatsApp necesita el 9 de los celulares (549 y diez dígitos). Sin él, wa.me dice que
  // el número no existe; con el 15 adentro, también. Lo que no cierra en diez dígitos no va.
  if (d.startsWith("54")) {
    let resto = d.slice(2);
    if (resto.startsWith("9") && resto.length === 11) resto = resto.slice(1);
    resto = resto.replace(/^0/, "");
    if (resto.length === 12) resto = sinQuince(resto);
    if (!resto || resto.length !== 10 || resto.startsWith("15")) return null;
    d = `549${resto}`;
  }
  return d.length >= 10 && d.length <= 15 ? d : null;
}

// Un nombre cortado a la mitad de un emoji deja una mitad suelta, y encodeURIComponent tira con eso.
const bienFormado = (t) => (typeof t.toWellFormed === "function" ? t.toWellFormed() : t.replace(/[\uD800-\uDFFF]/g, "\uFFFD"));

/** El link que abre WhatsApp con el mensaje ya escrito, y el número (va en el botón, para que ella vea a
 *  quién le escribe antes de tocar). null si no hay un número confiable. */
export function linkOferta({ whatsapp, pais, nombre }) {
  const numero = numeroWhatsapp(whatsapp, pais);
  if (!numero) return null;
  return { numero, url: `https://wa.me/${numero}?text=${encodeURIComponent(bienFormado(mensajeOferta(nombre)))}` };
}

/**
 * Se le ofrece a quien compró el curso en español y pagó: en dólares, o en pesos y entró con el
 * código. No a una devolución, ni a una cuota que no es la primera, ni a un acceso regalado
 * (testimonio, código de 100%), ni a quien compró el acompañamiento mismo o el curso en inglés (la
 * oferta y el doc son en español).
 */
export function correspondeOferta({ producto, baja, gratis, porQue, recurrente }) {
  // Cada cuota de los que pagan en cuotas vuelve a mandar el ping: la oferta va una vez, con la primera.
  if (baja || recurrente) return false;
  if (gratis && porQue !== PAGO_EN_PESOS) return false;
  return /acelerador/i.test(String(producto || ""));
}
