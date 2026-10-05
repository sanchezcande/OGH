// Falla si en los textos del sitio reaparece un servicio que ya no se ofrece o una cifra sin confirmar.
// Uso: node scripts/check-afirmaciones.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const CARPETAS = ["pages", "src/components", "src/locales"];
// /labsmail es la página de un producto propio que se decidió dejar: no se revisa acá.
const SALTEAR = [/^pages\/labsmail\.jsx$/];

const PROHIBIDO = [
  [/automat/i, "automatización"],
  [/\bn8n\b/i, "n8n"],
  [/\/calculator\b/, "enlace a la calculadora"],
  [/9[.,]7\s*\/\s*10|\b9[.,]7\b.{0,12}(CSAT|satisf)/i, "9.7 de satisfacción"],
  [/\b7[.,]3[- ](d[ií]a|day)/i, "7.3 días"],
  [/\b(87|96)\s?%/, "entregas a tiempo"],
  [/\b28\s?%/, "28% de cycle time"],
  [/\b50\+\s*sprints/i, "50+ sprints"],
  [/\b300\+/, "300+ procesos"],
  [/\b(66|50)\s+(encuestas|client surveys|surveys)/i, "encuestas"],
  [/(Founder|Fundadora)\s*(&|&amp;|y|and)\s*CTO/i, "Founder & CTO (cargo incorrecto)"],
];

// Usos que no son una promesa de OpenGateHub: el rol de una persona del equipo.
const PERMITIDO = [
  /QA Automation|Automation QA|Automatizaci[oó]n QA|testing de automatizaci[oó]n|automation testing|test automation/i,
];

const archivos = [];
const recorrer = (dir) => {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) recorrer(ruta);
    else if (/\.(js|jsx|json)$/.test(nombre)) archivos.push(ruta);
  }
};
CARPETAS.forEach((c) => recorrer(join(raiz, c)));

const hallazgos = [];
const revisar = (donde, texto, soloSiNombraOGH = false) => {
  for (const frase of texto.split(/\n|(?<=[.!?])\s+/)) {
    if (soloSiNombraOGH && !/OpenGateHub/i.test(frase)) continue;
    if (PERMITIDO.some((p) => p.test(frase))) continue;
    for (const [patron, nombre] of PROHIBIDO) {
      if (patron.test(frase)) hallazgos.push(`${donde}: ${nombre} → ${frase.trim().slice(0, 140)}`);
    }
  }
};

const recorrerJson = (donde, valor, ruta = "") => {
  if (typeof valor === "string") {
    // En los artículos del blog el texto informativo sobre automatización queda hasta la poda;
    // solo falla lo que se dice de OpenGateHub. Los slugs son direcciones y no se tocan.
    if (/\/slug$/.test(ruta)) return;
    // La bio de cada persona del equipo describe su oficio (por ejemplo, QA automation), no una oferta.
    if (/^\/teamSection\/members\//.test(ruta)) return;
    const esArticulo = /^\/articles\/\d+\/(title|summary|content)$/.test(ruta);
    revisar(`${donde} ${ruta}`, valor, esArticulo);
  } else if (valor && typeof valor === "object") {
    for (const [k, v] of Object.entries(valor)) recorrerJson(donde, v, `${ruta}/${k}`);
  }
};

for (const ruta of archivos) {
  const rel = relative(raiz, ruta);
  if (SALTEAR.some((p) => p.test(rel))) continue;
  const texto = readFileSync(ruta, "utf8");
  if (rel.endsWith(".json")) recorrerJson(rel, JSON.parse(texto));
  else texto.split("\n").forEach((linea, i) => revisar(`${rel}:${i + 1}`, linea));
}

if (hallazgos.length) {
  console.error(`${hallazgos.length} afirmaciones sin confirmar:\n` + hallazgos.join("\n"));
  process.exit(1);
}
console.log(`Sin automatización ni cifras sin confirmar en ${archivos.length} archivos.`);
