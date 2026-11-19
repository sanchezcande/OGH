/**
 * Rearma los números de /datos-developers-latam desde la base, solo.
 *
 * Por qué (Cande, 19/11/2026: "mi tiempo vale oro"). El informe es lo único del sitio que nadie
 * más tiene y es lo que un modelo puede citar, pero una foto de noviembre se pone vieja y lo
 * viejo se deja de citar: la frescura es de lo que más pesa. Esto lo deja al día sin que nadie
 * escriba un número a mano, y encima el N crece solo, que es lo que hace el dato más fuerte.
 *
 *   node scripts/datos_devs.mjs              escribe data/datos-devs.json
 *   node scripts/datos_devs.mjs --ver        además lo imprime
 *   node scripts/datos_devs.mjs --publicar   si cambió algo: commit, push y aviso a los buscadores.
 *                                            El push es lo que hace que Vercel lo publique.
 *
 * Reglas al tocar esto:
 * - Solo agregados. Nunca un nombre, un mail, un perfil ni un CV.
 * - Nada de `github`, `linkedin` ni `cv_url`: el formulario de /devs NO los pide, así que están
 *   casi siempre vacíos y publicar ese porcentaje sería una estadística falsa.
 * - La tarifa se lee solo cuando es un número limpio de 1 a 3 dígitos. Hay respuestas como
 *   "25-50" y "20/25" que no son un número y quedan afuera del cálculo, no en cero.
 * - Mediana y percentiles, no promedio: con tarifas sueltas de 100 o más el promedio engañaría.
 */
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const m = l.match(/^([A-Z_]+)="?([^"]*)"?$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { sql } = await import("@vercel/postgres");

// La tarifa como número, solo cuando es un número limpio.
const T = `(CASE WHEN tarifa ~ '^[0-9]{1,3}$' THEN tarifa::numeric END)`;
const num = (v) => (v == null ? null : Number(v));

const total = (await sql`SELECT count(*) AS n, min(creado)::date AS desde, max(creado)::date AS hasta FROM red_devs`).rows[0];

const tarifaPorNivel = (await sql.query(`
  SELECT seniority AS nivel, count(${T})::int AS n,
         round(percentile_cont(0.5)  WITHIN GROUP (ORDER BY ${T}))::int AS mediana,
         round(percentile_cont(0.25) WITHIN GROUP (ORDER BY ${T}))::int AS p25,
         round(percentile_cont(0.75) WITHIN GROUP (ORDER BY ${T}))::int AS p75
  FROM red_devs WHERE seniority IS NOT NULL GROUP BY 1 HAVING count(${T}) > 0 ORDER BY 3`)).rows;

const tarifaGlobal = (await sql.query(`
  SELECT count(${T})::int AS n,
         round(percentile_cont(0.5) WITHIN GROUP (ORDER BY ${T}))::int AS mediana,
         round(percentile_cont(0.1) WITHIN GROUP (ORDER BY ${T}))::int AS p10,
         round(percentile_cont(0.9) WITHIN GROUP (ORDER BY ${T}))::int AS p90
  FROM red_devs`)).rows[0];

const ingles = (await sql.query(`
  SELECT ingles AS nivel, count(*)::int AS n,
         round(percentile_cont(0.5) WITHIN GROUP (ORDER BY ${T}))::int AS mediana
  FROM red_devs WHERE ingles IS NOT NULL GROUP BY 1 ORDER BY 3`)).rows;

const fluidoPorNivel = (await sql`
  SELECT seniority AS nivel, count(*) FILTER (WHERE ingles = 'Fluido')::int AS fluido, count(*)::int AS total
  FROM red_devs WHERE seniority IS NOT NULL GROUP BY 1 ORDER BY 3 DESC`).rows;

const situacion = (await sql`
  SELECT situacion AS que, count(*)::int AS n FROM red_devs
  WHERE situacion IS NOT NULL AND situacion <> '' GROUP BY 1 ORDER BY 2 DESC`).rows;

const seniority = (await sql`
  SELECT seniority AS que, count(*)::int AS n FROM red_devs
  WHERE seniority IS NOT NULL GROUP BY 1 ORDER BY 2 DESC`).rows;

const experiencia = (await sql`
  SELECT experiencia AS que, count(*)::int AS n FROM red_devs
  WHERE experiencia IS NOT NULL AND experiencia <> '' GROUP BY 1 ORDER BY 2 DESC`).rows;

const dedicacion = (await sql`
  SELECT dedicacion AS que, count(*)::int AS n FROM red_devs
  WHERE dedicacion IS NOT NULL AND dedicacion <> '' GROUP BY 1 ORDER BY 2 DESC`).rows;

// Los roles vienen escritos a mano en algunos casos ("Product Owner/PM" y "Product Owner / PM"),
// así que se juntan por el nombre sin espacios alrededor de las barras.
const rolesCrudos = (await sql`
  SELECT rol_principal AS que, count(*)::int AS n FROM red_devs
  WHERE rol_principal IS NOT NULL AND rol_principal <> '' GROUP BY 1`).rows;
const juntados = new Map();
for (const r of rolesCrudos) {
  const k = r.que.replace(/\s*\/\s*/g, " / ").trim();
  juntados.set(k, (juntados.get(k) || 0) + Number(r.n));
}
const roles = [...juntados].map(([que, n]) => ({ que, n })).sort((a, b) => b.n - a.n);

const pct = (a, b) => Math.round((a / b) * 1000) / 10;
const N = Number(total.n);
const d = (v) => new Date(v).toISOString().slice(0, 10);

const salida = {
  // El dia de ACA, no el UTC: de noche en Bali toISOString() devuelve el dia anterior y la
  // pagina diria que se actualizo ayer.
  generado: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
  n: N,
  desde: d(total.desde),
  hasta: d(total.hasta),
  tarifa: { n: num(tarifaGlobal.n), mediana: num(tarifaGlobal.mediana), p10: num(tarifaGlobal.p10), p90: num(tarifaGlobal.p90) },
  tarifaPorNivel: tarifaPorNivel.map((r) => ({ nivel: r.nivel, n: num(r.n), mediana: num(r.mediana), p25: num(r.p25), p75: num(r.p75) })),
  ingles: ingles.map((r) => ({ nivel: r.nivel, n: num(r.n), pct: pct(Number(r.n), N), mediana: num(r.mediana) })),
  fluidoPorNivel: fluidoPorNivel.map((r) => ({ nivel: r.nivel, fluido: num(r.fluido), total: num(r.total), pct: pct(Number(r.fluido), Number(r.total)) })),
  situacion: situacion.map((r) => ({ que: r.que, n: num(r.n), pct: pct(Number(r.n), N) })),
  seniority: seniority.map((r) => ({ que: r.que, n: num(r.n) })),
  experiencia: experiencia.map((r) => ({ que: r.que, n: num(r.n) })),
  dedicacion: dedicacion.map((r) => ({ que: r.que, n: num(r.n), pct: pct(Number(r.n), N) })),
  roles,
};

const antes = (() => { try { return readFileSync("data/datos-devs.json", "utf8"); } catch { return ""; } })();
const nuevo = JSON.stringify(salida, null, 1) + "\n";
writeFileSync("data/datos-devs.json", nuevo);

// El llms.txt nombra el N, asi que se actualiza del mismo lado: un solo lugar donde vive el numero.
try {
  const ruta = "public/llms.txt";
  const txt = readFileSync(ruta, "utf8")
    .replace(/se anotaron\s+\d[\d.]*\s+developers/g, `se anotaron ${N} developers`)
    .replace(/Datos de\s+\d[\d.]*\s+developers/g, `Datos de ${N} developers`);
  writeFileSync(ruta, txt);
} catch { /* si no esta el archivo, no es motivo para romper el informe */ }

console.log(`data/datos-devs.json · ${N} developers · ${salida.desde} al ${salida.hasta} · mediana USD ${salida.tarifa.mediana}/h sobre ${salida.tarifa.n} tarifas`);
if (process.argv.includes("--ver")) console.log(JSON.stringify(salida, null, 1));

if (process.argv.includes("--publicar")) {
  if (antes === nuevo) {
    console.log("sin cambios: no hay nada que publicar");
  } else {
    // Solo estos dos archivos. Si hay otra cosa a medio hacer en el repo, no se arrastra.
    execSync('git add data/datos-devs.json public/llms.txt', { stdio: "inherit" });
    execSync(`git commit -q -m "Datos de developers al dia: ${N} perfiles, mediana USD ${salida.tarifa.mediana}/h" ` +
             '-m "Lo rearma solo scripts/datos_devs.mjs desde red_devs. Una foto vieja se deja de citar."', { stdio: "inherit" });
    execSync("git push -q origin HEAD", { stdio: "inherit" });
    console.log("publicado · Vercel lo levanta solo");
    try {
      execSync("node scripts/indexnow.mjs /datos-developers-latam /como-conseguir-trabajo-de-developer /en/hire-developers-latin-america", { stdio: "inherit" });
    } catch { console.log("el aviso a los buscadores fallo, pero el dato ya esta publicado"); }
  }
}
