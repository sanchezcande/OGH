/**
 * Avisa a los buscadores que una pagina es nueva o cambio, por IndexNow.
 *
 * Para que ChatGPT, Claude o Perplexity puedan citar una pagina, primero alguien tiene que
 * rastrearla. IndexNow es el protocolo que usan Bing (que es el indice atras de Copilot),
 * Yandex y Seznam: les avisas vos en vez de esperar a que pasen. Google no lo usa, pero por
 * Google esta el sitemap, que ya se genera.
 *
 *   node scripts/indexnow.mjs                      avisa por las paginas de la lista de abajo
 *   node scripts/indexnow.mjs /una/pagina /otra    avisa solo por esas
 *
 * La clave vive en public/<clave>.txt y tiene que seguir ahi: el buscador la lee para
 * comprobar que el que avisa es el dueno del sitio. Si se borra el archivo, deja de funcionar.
 */
const CLAVE = "e40eca611e7f40f0bc698def3fa03fa9";
const HOST = "www.opengatehub.com";
const PAGINAS = [
  "/",
  "/como-conseguir-trabajo-de-developer",
  "/datos-developers-latam",
  "/devs",
  "/preguntas",
];

const rutas = process.argv.slice(2).length ? process.argv.slice(2) : PAGINAS;
const urlList = rutas.map((r) => `https://${HOST}${r.startsWith("/") ? r : "/" + r}`);

const r = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: CLAVE, keyLocation: `https://${HOST}/${CLAVE}.txt`, urlList }),
});
// 200 y 202 son las dos respuestas buenas: 202 quiere decir que recibieron el aviso y van a
// comprobar la clave. 403 es la clave mal, 422 una URL que no es de este host.
console.log(r.status, r.statusText, "·", urlList.length, "paginas");
if (![200, 202].includes(r.status)) console.log(await r.text());
