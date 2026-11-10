// La puerta única de pago (/comprar, 10/11). Lo que no puede fallar: que un argentino no termine en
// el checkout en dólares (de 41 que tocaron comprar, ninguno pagó en dólares), que nadie que NO sea
// argentino termine en el de pesos (MercadoPago no le cobra), y que el país elegido llegue a la
// compra.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  OTRO, PAISES, destinoDePago, faseDePago, nombreDePais, pagaEnPesos, paisDeCabecera,
  paisDeclarado, paisDeReferencia, puedePorGumroad, referenciaDePesos,
} from "../lib/paisCompra.js";

const DESTINOS = { pesos: "/api/pagar-pesos", gumroad: "https://get.opengatehub.com/l/acelerador-de-carrera" };

test("Argentina va a MercadoPago en pesos y nadie más", () => {
  assert.match(destinoDePago("AR", DESTINOS), /^\/api\/pagar-pesos\?pais=AR$/);
  for (const { codigo } of PAISES) {
    if (codigo === "AR") continue;
    const d = destinoDePago(codigo, DESTINOS);
    assert.equal(d === null || !d.startsWith("/api/pagar-pesos"), true,
      `${codigo} no puede ir al checkout en pesos: MercadoPago no le cobra`);
  }
});

test("el resto va a Gumroad en dolares, con su pais puesto", () => {
  assert.equal(destinoDePago("MX", DESTINOS), `${DESTINOS.gumroad}?pais=MX`);
  assert.equal(destinoDePago("ES", DESTINOS), `${DESTINOS.gumroad}?pais=ES`);
  // "Otro país" no es un país: no se inventa uno en el link.
  assert.equal(destinoDePago(OTRO, DESTINOS), DESTINOS.gumroad);
});

test("sin cabecera de Vercel NUNCA se adivina Argentina", () => {
  // Es el error caro: mandar a un checkout en pesos a quien no puede pagar en pesos.
  assert.equal(paisDeCabecera(undefined), OTRO);
  assert.equal(paisDeCabecera(""), OTRO);
  assert.equal(paisDeCabecera("ZZ"), OTRO);
  assert.equal(paisDeCabecera("Argentina"), OTRO, "la cabecera es el ISO de dos letras, no el nombre");
  assert.equal(paisDeCabecera("ar"), "AR");
  assert.equal(paisDeCabecera("MX"), "MX");
});

test("desde Cuba no hay boton de Gumroad: Gumroad no cobra desde ahi", () => {
  assert.equal(puedePorGumroad("CU"), false);
  assert.equal(destinoDePago("CU", DESTINOS), null);
  assert.equal(nombreDePais("CU"), "Cuba");
  // Y tampoco es argentina, así que no hay camino de pesos para taparlo.
  assert.equal(pagaEnPesos("CU"), false);
});

test("el clic manda la MISMA fase que /devs/gracias", () => {
  // Si cambia, el agente deja de ver que la persona tocó pagar (lib/dm/pagina.js, NOTA_DE_FASE) y
  // el embudo parte en dos los dos caminos de pago.
  assert.equal(faseDePago("AR"), "click_mp");
  assert.equal(faseDePago("MX"), "click_gumroad");
  assert.equal(faseDePago(OTRO), "click_gumroad");
  const pagina = readFileSync(new URL("../lib/dm/pagina.js", import.meta.url), "utf8");
  for (const fase of ["click_mp", "click_gumroad"]) {
    assert.match(pagina, new RegExp(`${fase}:`), `${fase} tiene que seguir dejando nota en la charla`);
  }
});

test("la fase de la pagina esta aceptada por /api/evento (si no, contesta 400 y se pierde el dato)", () => {
  const evento = readFileSync(new URL("../pages/api/evento.js", import.meta.url), "utf8");
  assert.match(evento, /"comprar_vista"/);
});

test("el pais elegido va y vuelve por MercadoPago", () => {
  const ref = referenciaDePesos("AR", 1700000000000);
  assert.equal(ref, "curso-pesos-AR-1700000000000");
  assert.equal(paisDeReferencia(ref), "AR");
  // El prefijo tiene que seguir distinguiendose del 1 a 1 (mp-webhook.js, es1a1).
  assert.equal(ref.startsWith("1a1-"), false);
  assert.match(ref, /^curso-pesos-/);
  // Las referencias de antes del 10/11 no traen pais: no se inventa uno.
  assert.equal(paisDeReferencia("curso-pesos-1700000000000"), null);
  assert.equal(paisDeReferencia("1a1-pesos-1700000000000"), null);
  assert.equal(paisDeReferencia(""), null);
});

test("un ?pais= de afuera no se guarda si no es un pais de la lista", () => {
  assert.equal(paisDeclarado("mx"), "MX");
  assert.equal(paisDeclarado("<script>alert(1)</script>"), null);
  assert.equal(paisDeclarado("ZZ"), null);
  assert.equal(paisDeclarado(OTRO), null, '"Otro país" no es un país');
  assert.equal(paisDeclarado(null), null);
  // Y lo que no vale no puede ensuciar la referencia externa.
  assert.equal(referenciaDePesos(paisDeclarado("ZZ"), 1).startsWith("curso-pesos-1"), true);
});

test("las dos APIs de pago guardan el pais elegido en compras.pais", () => {
  const pesos = readFileSync(new URL("../pages/api/pagar-pesos.js", import.meta.url), "utf8");
  assert.match(pesos, /external_reference: referenciaDePesos\(paisDeclarado\(req\.query\?\.pais\)\)/);
  const mp = readFileSync(new URL("../pages/api/mp-webhook.js", import.meta.url), "utf8");
  assert.match(mp, /paisDeReferencia\(pago\.external_reference\)/);
  const gum = readFileSync(new URL("../pages/api/gumroad-ping.js", import.meta.url), "utf8");
  // En Gumroad el país declarado le gana al de la IP, que miente seguido (VPN, vivir afuera).
  assert.match(gum, /pais: paisElegido\(b\) \|\| f\?\.pais \|\| limpiar\(b\.ip_country/);
  assert.match(gum, /url_params\[pais\]/);
});

test("el agente puede mandar el link y le entra el id de la charla", async () => {
  const frenos = readFileSync(new URL("../lib/dm/frenos.js", import.meta.url), "utf8");
  assert.match(frenos, /const LINKS_PROPIOS = \[[^\]]*"opengatehub\.com\/comprar"/,
    "sin esto el freno de links frena el mensaje y el agente no puede mandar la puerta de pago");
  const { conIdDeCharla, esLinkConId } = await import("../lib/dm/linkFormulario.js");
  assert.equal(conIdDeCharla("opengatehub.com/comprar", "12345", { firma: "abcdefghij" }),
    "opengatehub.com/comprar?ig=12345&f=abcdefghij");
  assert.equal(esLinkConId("opengatehub.com/comprar?ig=12345&f=abcdefghij", "12345"), true);
  assert.equal(esLinkConId("opengatehub.com/comprar?ig=99999&f=abcdefghij", "12345"), false,
    "el link con la charla de otra persona no puede salir");
  // Y la página del video sigue sin tocarse.
  assert.equal(conIdDeCharla("opengatehub.com/devs/gracias", "12345", { firma: "abcdefghij" }),
    "opengatehub.com/devs/gracias");
});

test("la pagina no se indexa y el precio en pesos sale de la misma variable que cobra MercadoPago", () => {
  const src = readFileSync(new URL("../pages/comprar.jsx", import.meta.url), "utf8");
  assert.match(src, /name="robots" content="noindex"/);
  // Si el precio de la página y el del checkout salieran de variables distintas, un día muestran
  // números distintos y la persona se entera en el checkout.
  assert.match(src, /process\.env\.MP_PRECIO_ARS \|\| 39750/);
  const pesos = readFileSync(new URL("../pages/api/pagar-pesos.js", import.meta.url), "utf8");
  assert.match(pesos, /process\.env\.MP_PRECIO_ARS \|\| 39750/);
});

test("el desplegable no tiene paises repetidos ni codigos repetidos", () => {
  const codigos = PAISES.map((p) => p.codigo);
  assert.equal(new Set(codigos).size, codigos.length);
  const nombres = PAISES.map((p) => p.nombre);
  assert.equal(new Set(nombres).size, nombres.length);
  assert.equal(PAISES[PAISES.length - 1].codigo, OTRO, '"Otro país" va al final de la lista');
});

test("no se le pregunta el pais a quien ya lo contesto en el formulario", () => {
  // Cande, 10/11: "qué es ese form aparte, agregalo al form normal". El formulario de /devs pide
  // "País y ciudad" obligatorio desde siempre: volver a preguntarlo antes de pagar es un paso de
  // más justo donde menos se lo banca.
  const src = readFileSync(new URL("../pages/comprar.jsx", import.meta.url), "utf8");
  assert.match(src, /delFormulario \|\| paisDeCabecera/,
    "lo que puso en el formulario tiene que ganarle a la IP de Vercel");
  assert.match(src, /firmaValida\(ig, firmaDeLink\(query\?\.f\)\)/,
    "sin la firma del id no se mira ninguna ficha: el id viaja en claro");
  assert.match(src, /Pusiste que sos de/);
});

test("el pais sale del texto libre del formulario, con UNA sola lista en el repo", async () => {
  const { paisDeTextoLibre } = await import("../lib/paisCompra.js");
  assert.equal(paisDeTextoLibre("Argentina, Córdoba"), "AR");
  assert.equal(paisDeTextoLibre("CABA"), "AR");
  assert.equal(paisDeTextoLibre("Buenos Aires"), "AR");
  assert.equal(paisDeTextoLibre("México DF"), "MX");
  assert.equal(paisDeTextoLibre("madrid"), "ES");
  assert.equal(paisDeTextoLibre("La Habana, Cuba"), "CU");
  assert.equal(paisDeTextoLibre("Marte"), null, "lo que no se reconoce no se adivina");
  assert.equal(paisDeTextoLibre(""), null);
  // Y el agente usa ESTA lista, no una copia suya: dos listas se separan solas.
  const pagina = readFileSync(new URL("../lib/dm/pagina.js", import.meta.url), "utf8");
  assert.match(pagina, /import \{ nombreDePais, paisDeTextoLibre \} from "\.\.\/paisCompra"/);
  assert.equal(/\["Argentina", \//.test(pagina), false, "quedó la copia vieja de la lista de países");
});
