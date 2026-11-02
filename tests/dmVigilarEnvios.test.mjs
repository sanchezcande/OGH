// El reloj del envío (lib/dm/vigilarEnvios.js).
//
// Lo que tiene que atajar es lo que pasó el 31/10: el agente seguía corriendo, la bandeja seguía
// leyendo, y lo que mandaba no llegaba a nadie. Nos enteramos un día después y a mano. Con ManyChat
// cancelado (Cande, 02/11) no hay nadie más que avise.
//
// Y lo que NO puede hacer es avisar de más: un Telegram cada 15 minutos se vuelve ruido que ella
// deja de leer, que termina siendo peor que no avisar.
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
const { vigilarEnvios, VENTANA_HORAS, AVISO_CADA_HORAS } = await import("../lib/dm/vigilarEnvios.js");

/** Una base de mentira con los números de la ventana y la memoria del último aviso. */
const armar = (pulso, config = {}) => {
  const guardado = { ...config };
  const avisos = [];
  return {
    avisos,
    guardado,
    base: {
      pulsoEnvios: async () => pulso,
      leerConfig: async (k) => guardado[k],
      guardarConfig: async (k, v) => { guardado[k] = v; },
    },
    avisar: async (titulo, campos) => { avisos.push({ titulo, campos }); return true; },
  };
};

test("le escribieron y no salió nada: avisa", async () => {
  const d = armar({ leads: 7, enviadas: 0, inciertas: 0, errores: 0 });
  const r = await vigilarEnvios(d);
  assert.equal(r.aviso, true);
  assert.equal(r.mudo, true);
  assert.match(d.avisos[0].campos.Qué, /7 veces/);
  assert.match(d.avisos[0].campos.Hacé, /bandeja de Instagram/, "le dice qué hacer mientras tanto");
});

test("nadie escribió: no hay nada que concluir", async () => {
  const d = armar({ leads: 0, enviadas: 0, inciertas: 0, errores: 0 });
  const r = await vigilarEnvios(d);
  assert.equal(r.aviso, false, "de noche no escribe nadie y eso no es una falla");
  assert.deepEqual(d.avisos, []);
});

test("lo que sale no llega: avisa con los números", async () => {
  // El 31/10 en una imagen: ManyChat devolvía incierta una atrás de otra.
  const d = armar({ leads: 9, enviadas: 1, inciertas: 6, errores: 0 });
  const r = await vigilarEnvios(d);
  assert.equal(r.aviso, true);
  assert.equal(r.roto, true);
  assert.match(d.avisos[0].campos.Qué, /6 no llegaron y 1 sí/);
});

test("una falla suelta no es una alarma", async () => {
  const d = armar({ leads: 9, enviadas: 8, inciertas: 1, errores: 1 });
  const r = await vigilarEnvios(d);
  assert.equal(r.aviso, false, "siempre hay alguna: la alarma es cuando fallan más de las que salen");
});

test("dos fallas y nada más tampoco", async () => {
  const d = armar({ leads: 2, enviadas: 0, inciertas: 2, errores: 0 });
  const r = await vigilarEnvios(d);
  // Mudo igual: le escribieron dos veces y no salió nada. Lo que se mira acá es que avise una sola
  // vez, no dos por el mismo rato.
  assert.equal(r.aviso, true);
  assert.equal(d.avisos.length, 1);
});

test("no vuelve a avisar hasta pasadas seis horas", async () => {
  const d = armar({ leads: 7, enviadas: 0, inciertas: 0, errores: 0 });
  await vigilarEnvios(d);
  assert.equal(d.avisos.length, 1);
  assert.ok(d.guardado.envios_salud?.avisado_en, "se anota cuándo avisó");

  const r2 = await vigilarEnvios(d);
  assert.equal(r2.aviso, false);
  assert.equal(r2.callado, true);
  assert.equal(d.avisos.length, 1, "cada 15 minutos sería ruido: ella deja de leerlos");

  // Siete horas después, si sigue roto, sí.
  const luego = new Date(Date.now() + (AVISO_CADA_HORAS + 1) * 3600000);
  const r3 = await vigilarEnvios({ ...d, ahora: () => luego });
  assert.equal(r3.aviso, true);
  assert.equal(d.avisos.length, 2);
});

test("si no se puede medir, no inventa una alarma", async () => {
  const avisos = [];
  const r = await vigilarEnvios({
    base: { pulsoEnvios: async () => { throw new Error("base caída"); }, leerConfig: async () => null, guardarConfig: async () => {} },
    avisar: async () => { avisos.push(1); return true; },
  });
  assert.equal(r.miro, false);
  assert.deepEqual(avisos, [], "de la base caída ya avisa la red de la bandeja");
});

test("si el aviso no sale, no queda anotado como avisado", async () => {
  const d = armar({ leads: 7, enviadas: 0, inciertas: 0, errores: 0 });
  const r = await vigilarEnvios({ ...d, avisar: async () => { throw new Error("Telegram caído"); } });
  assert.equal(r.aviso, false);
  assert.equal(d.guardado.envios_salud, undefined, "si no salió, la próxima vuelta lo intenta de nuevo");
});

test("la ventana son dos horas", () => {
  assert.equal(VENTANA_HORAS, 2);
  assert.equal(AVISO_CADA_HORAS, 6);
});

test("el cron de la bandeja lo llama, y un fallo suyo no tumba la vuelta", async () => {
  const { readFile } = await import("node:fs/promises");
  const src = await readFile(new URL("../pages/api/dm/bandeja.js", import.meta.url), "utf8");
  assert.match(src, /vigilarEnvios\(\{ base: \{ pulsoEnvios, leerConfig, guardarConfig \}, avisar: avisarDm \}\)/);
  assert.match(src, /try \{\s*await vigilarEnvios[\s\S]*?\} catch/, "mirar si los envíos salen no puede romper la bandeja");
});
