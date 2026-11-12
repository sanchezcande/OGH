// El sid del navegador guardado junto al lead (10/11). Es lo único que faltaba para poder atar un
// "tocó pagar y no pagó" a una persona: funnel_eventos tiene fase, sid y fecha, y nada más, así que
// los 41 abandonos de pago de los últimos 30 días no tenían nombre.
//
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";   // registra los ganchos de carga y los dobles: no toca la base
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { sidDeLead } = await import("../lib/db.js");
const { FASES_ABANDONO, enPesos } = await import("../lib/abandono.js");

test("el sid que manda la pagina entra; lo que venga de afuera, no", () => {
  // Los que arma sid() en lib/embudo.js: Math.random en base 36 + la fecha en base 36.
  assert.equal(sidDeLead("2zxvuvhy8rnmwad3xpj"), "2zxvuvhy8rnmwad3xpj");
  assert.equal(sidDeLead("  2zxvuvhy8rnmwad3xpj  "), "2zxvuvhy8rnmwad3xpj");
  // Texto de afuera: la API es pública y el cuerpo del formulario no tiene lista blanca.
  assert.equal(sidDeLead("'; DROP TABLE red_devs; --"), null);
  assert.equal(sidDeLead("<script>alert(1)</script>"), null);
  assert.equal(sidDeLead("corto"), null, "menos de 8 no es uno de los nuestros");
  assert.equal(sidDeLead("a".repeat(41)), null, "mas de 40 tampoco");
  assert.equal(sidDeLead(null), null);
  assert.equal(sidDeLead(undefined), null);
  assert.equal(sidDeLead(12345678), null, "solo texto");
});

test("el sid del lead vale el ULTIMO, al reves que la puerta", () => {
  // La puerta es la primera por la que entró. El sid es el navegador en el que está AHORA, que es
  // de donde van a salir los eventos de pago: si se guardara el primero, el abandono no se ataría.
  const db = readFileSync(new URL("../lib/db.js", import.meta.url), "utf8");
  assert.match(db, /sid = COALESCE\(EXCLUDED\.sid, red_devs\.sid\)/);
  assert.match(db, /puerta = COALESCE\(red_devs\.puerta, EXCLUDED\.puerta\)/);
  // Y la columna se crea sola, como ig_contacto y puerta.
  assert.match(db, /ADD COLUMN IF NOT EXISTS sid TEXT`\.catch\(yaEstaba\)/);
  assert.match(db, /CREATE INDEX IF NOT EXISTS red_devs_sid_idx/);
});

test("los DOS formularios mandan el sid, no solo el de espanol", () => {
  // El embudo en inglés (/apply) ya se perdió entero una vez por no estar en una lista (18/10).
  for (const pagina of ["../pages/devs/index.jsx", "../pages/apply/index.jsx"]) {
    const src = readFileSync(new URL(pagina, import.meta.url), "utf8");
    assert.match(src, /import \{ evento, sid \} from/, `${pagina} no importa sid`);
    assert.match(src, /sid\(\) \? \{ sid: sid\(\) \} : \{\}/, `${pagina} no lo manda`);
  }
});

test("la consulta de abandonos deja el colchon y no le escribe a quien ya compro", () => {
  const src = readFileSync(new URL("../lib/abandono.js", import.meta.url), "utf8");
  // Cande pidió ~10 minutos y no 0: a los 0 la persona está pagando en ese momento.
  assert.match(src, /hastaMinutos = 10/);
  assert.match(src, /e\.creado < now\(\) - make_interval\(mins => \$\{hastaMinutos\}\)/);
  // Una compra devuelta (baja) no cuenta como compra, pero tampoco se le vuelve a vender por acá.
  assert.match(src, /NOT EXISTS \(\s*SELECT 1 FROM compras p WHERE lower\(p\.email\) = lower\(r\.email\) AND NOT p\.baja/);
  // Solo lee: si esto escribiera, un error acá tocaría datos de gente real.
  assert.equal(/INSERT |UPDATE |DELETE /.test(src), false, "lib/abandono.js es de solo lectura");
});

test("sabe en que moneda se estaba yendo, para no hablarle del checkout equivocado", () => {
  assert.equal(enPesos("click_mp"), true);
  assert.equal(enPesos("click_mp_a"), true, "las variantes del A/B llevan sufijo");
  assert.equal(enPesos("click_gumroad"), false);
  assert.equal(enPesos("click_gumroad_en"), false, "el embudo en ingles lleva _en");
  assert.deepEqual(FASES_ABANDONO, ["click_mp", "click_gumroad"]);
});
