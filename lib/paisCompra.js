// La puerta única de pago: qué país elige la persona y adónde la manda eso.
//
// Cande, 09/11: "un solo link para el agente". Hasta ahora el agente tenía que elegir entre el
// checkout en dólares y el de pesos, y para eso tenía que adivinar de dónde era la persona. Mandaba
// el de dólares casi siempre, y eso cuesta plata: de 41 argentinos que tocaron comprar ninguno pagó
// en dólares, y el único que pagó lo hizo en pesos (medido el 18/10 sobre funnel_eventos). El
// checkout de Gumroad convierte ~1 de 8 y el de MercadoPago ~1 de 4.
//
// Ahora hay un solo link, /comprar, y el país lo elige la persona con el que trae Vercel ya puesto.
// Lo elige ELLA y no la IP a secas porque hay argentinos viviendo afuera (y al revés).
//
// Solo Argentina cambia el camino: MercadoPago no cobra a otros países (confirmado con los datos,
// las 6 compras por MP son todas en pesos). El resto va a Gumroad en dólares.
//
// Funciones puras, sin red ni base: las usan la página, la API y los tests.

/** El país que paga en pesos. */
export const ARGENTINA = "AR";

/** Lo que elige quien no está en la lista. No es un país: no se guarda como tal. */
export const OTRO = "XX";

/** Los países del desplegable, con el código ISO de dos letras que manda Vercel. En orden alfabético
 *  porque es como se busca uno en una lista; Argentina queda primera igual. "Otro país" va al final. */
export const PAISES = [
  { codigo: "AR", nombre: "Argentina" },
  { codigo: "BO", nombre: "Bolivia" },
  { codigo: "BR", nombre: "Brasil" },
  { codigo: "CL", nombre: "Chile" },
  { codigo: "CO", nombre: "Colombia" },
  { codigo: "CR", nombre: "Costa Rica" },
  { codigo: "CU", nombre: "Cuba" },
  { codigo: "EC", nombre: "Ecuador" },
  { codigo: "SV", nombre: "El Salvador" },
  { codigo: "ES", nombre: "España" },
  { codigo: "US", nombre: "Estados Unidos" },
  { codigo: "GT", nombre: "Guatemala" },
  { codigo: "HN", nombre: "Honduras" },
  { codigo: "MX", nombre: "México" },
  { codigo: "NI", nombre: "Nicaragua" },
  { codigo: "PA", nombre: "Panamá" },
  { codigo: "PY", nombre: "Paraguay" },
  { codigo: "PE", nombre: "Perú" },
  { codigo: "PR", nombre: "Puerto Rico" },
  { codigo: "DO", nombre: "República Dominicana" },
  { codigo: "UY", nombre: "Uruguay" },
  { codigo: "VE", nombre: "Venezuela" },
  { codigo: OTRO, nombre: "Otro país" },
];

const CODIGOS = new Set(PAISES.map((p) => p.codigo));

/** Desde dónde Gumroad no cobra: ahí el botón no puede mandar a Gumroad o la persona choca contra
 *  una pared sin explicación. Cuba es el caso conocido (memoria del 19/10): se la manda al DM, que
 *  es donde existe el camino para Cuba. */
export const SIN_GUMROAD = new Set(["CU"]);

/** El nombre del país, o null si ese código no está en la lista. */
export function nombreDePais(codigo) {
  const p = PAISES.find((x) => x.codigo === String(codigo || "").toUpperCase());
  return p ? p.nombre : null;
}

/**
 * El país que viene preseleccionado, a partir de la cabecera `x-vercel-ip-country`. Si no viene o no
 * está en la lista, queda "Otro país": nunca se adivina Argentina, porque elegir mal ese manda a un
 * checkout en pesos a alguien que no puede pagar en pesos.
 */
export function paisDeCabecera(valor) {
  const c = String(valor || "").trim().toUpperCase();
  return CODIGOS.has(c) ? c : OTRO;
}

/** Ese país paga en pesos por MercadoPago? */
export const pagaEnPesos = (codigo) => String(codigo || "").toUpperCase() === ARGENTINA;

/** Ese país puede pagar por Gumroad? */
export const puedePorGumroad = (codigo) => !SIN_GUMROAD.has(String(codigo || "").toUpperCase());

/** La fase del embudo del clic en pagar, la misma que manda /devs/gracias: así el agente ve en la
 *  charla que tocó pagar (lib/dm/pagina.js) y el embudo cuenta los dos caminos juntos. */
export const faseDePago = (codigo) => (pagaEnPesos(codigo) ? "click_mp" : "click_gumroad");

/** La referencia externa del pago en pesos, con el país adentro: es por donde el país elegido llega
 *  al webhook de MercadoPago, que es lo único que recibe de vuelta. El prefijo `curso-pesos-` lo usa
 *  mp-webhook.js para distinguirlo del 1 a 1 (`1a1-`): no cambiarlo. */
export function referenciaDePesos(codigo, ahora = Date.now()) {
  const c = String(codigo || "").toUpperCase();
  return `curso-pesos-${CODIGOS.has(c) && c !== OTRO ? `${c}-` : ""}${ahora}`;
}

/** El país de una referencia externa de MercadoPago (`curso-pesos-AR-1699...`), o null si no la trae
 *  (las de antes del 10/11 no la traen, y una referencia vieja no se inventa). */
export function paisDeReferencia(referencia) {
  const m = /^curso-pesos-([A-Z]{2})-\d+$/.exec(String(referencia || "").trim());
  return m && CODIGOS.has(m[1]) && m[1] !== OTRO ? m[1] : null;
}

/** El país que la persona declaró en /comprar, venga de Gumroad (`url_params[pais]`) o de donde sea.
 *  Solo uno de la lista: el resto es texto de afuera y no se guarda. */
export function paisDeclarado(valor) {
  const c = String(valor || "").trim().toUpperCase();
  return CODIGOS.has(c) && c !== OTRO ? c : null;
}

/**
 * Adónde va el botón para ese país. `pesos` y `gumroad` son los dos destinos base.
 * Devuelve null para los países desde donde Gumroad no cobra: ahí no hay botón, hay una explicación.
 * El país elegido viaja en el destino (`?pais=`) para poder guardarlo con la compra: Gumroad lo
 * devuelve en `url_params[pais]` en el ping y MercadoPago lo lleva en la referencia externa.
 */
export function destinoDePago(codigo, { pesos, gumroad }) {
  const c = String(codigo || "").toUpperCase();
  if (pagaEnPesos(c)) return `${pesos}${pesos.includes("?") ? "&" : "?"}pais=${ARGENTINA}`;
  if (!puedePorGumroad(c)) return null;
  const limpio = CODIGOS.has(c) && c !== OTRO ? c : "";
  return limpio ? `${gumroad}${gumroad.includes("?") ? "&" : "?"}pais=${limpio}` : gumroad;
}
