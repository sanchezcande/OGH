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
const { vigilarEnvios, VENTANA_HORAS, AVISO_CADA_HORAS, RESPUESTA_NORMAL_MIN, CHARLAS_SIN_NADA } = await import("../lib/dm/vigilarEnvios.js");

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
  const d = armar({ leads: 7, pendientes: 7, enviadas: 0, inciertas: 0, errores: 0 });
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

// 03/11: un lead escribió a las 11:10 UTC después de una noche sin nadie. A las 11:15 el reloj vio "1 mensaje, 0
// respuestas" y le dijo a Cande que contestara a mano; ella contestó y la charla dejó de ser del agente, que la iba a
// contestar en la vuelta de las 11:30. Lo recién llegado, las charlas de Cande y los turnos ya cerrados no son silencio.

test("lo recién llegado no cuenta: se le pide a la base solo lo de hace más de lo que tarda en contestar", async () => {
  const pedidos = [];
  const d = armar(null);
  d.base.pulsoEnvios = async (...args) => { pedidos.push(args); return { leads: 0, pendientes: 0, enviadas: 0, inciertas: 0, errores: 0 }; };
  const r = await vigilarEnvios(d);
  assert.deepEqual(pedidos, [[VENTANA_HORAS, RESPUESTA_NORMAL_MIN]]);
  assert.equal(r.aviso, false);
  // La espera contesta entre 5 y 20 minutos después de guardado (vuelta cada 15, toma lo de más de 5), más lo que tarda en redactar.
  assert.ok(RESPUESTA_NORMAL_MIN >= 25, "con menos, un mensaje que está por salir ya dispara la alarma");
});

test("un turno que el agente cerró (calló, avisó la foto, Cande contestó la retomada) no es silencio", async () => {
  const d = armar({ leads: 2, pendientes: 0, enviadas: 0, inciertas: 0, errores: 0 });
  const r = await vigilarEnvios(d);
  assert.equal(r.aviso, false, "un 'gracias' de noche que el agente deja pasar no es una falla");
  assert.deepEqual(d.avisos, []);
});

test("un mensaje sin atender hace rato y nada que salga: avisa, y dice desde cuándo cuenta", async () => {
  const d = armar({ leads: 1, pendientes: 1, enviadas: 0, inciertas: 0, errores: 0 });
  const r = await vigilarEnvios(d);
  assert.equal(r.aviso, true);
  assert.equal(r.mudo, true);
  assert.match(d.avisos[0].campos.Qué, /1 vez/);
  assert.match(d.avisos[0].campos.Qué, new RegExp(`más de ${RESPUESTA_NORMAL_MIN} minutos`));
});

test("con mensajes esperando pero respuestas saliendo, no es mudo (la mañana con la espera vaciándose)", async () => {
  const d = armar({ leads: 8, pendientes: 5, enviadas: 3, inciertas: 0, errores: 0 });
  const r = await vigilarEnvios(d);
  assert.equal(r.aviso, false);
});

test("un agente que calla con todos también avisa, si escribieron varias charlas", async () => {
  assert.equal(CHARLAS_SIN_NADA, 3);
  const d = armar({ leads: CHARLAS_SIN_NADA, pendientes: 0, enviadas: 0, inciertas: 0, errores: 0 });
  const r = await vigilarEnvios(d);
  assert.equal(r.aviso, true, "turnos cerrados sin mandar nada a nadie también es no contestar");
  assert.match(d.avisos[0].campos.Qué, /3 personas/);
});

test("la base cuenta solo charlas del agente, por la hora de guardado, y los turnos abiertos como sinContestar", async () => {
  const { readFile } = await import("node:fs/promises");
  const src = await readFile(new URL("../lib/dm/base.js", import.meta.url), "utf8");
  const fn = src.slice(src.indexOf("export async function pulsoEnvios"), src.indexOf("export async function marcarIgBuscado"));
  assert.match(fn, /pulsoEnvios\(horas = 2, minutos = 30\)/);
  assert.match(fn, /c\.dueno = 'agente'/, "las charlas de Cande las contesta ella");
  assert.match(fn, /c\.personal IS NOT TRUE/);
  assert.match(fn, /COALESCE\(m\.guardado_red, m\.creado\) <= NOW\(\) - make_interval\(mins => \$\{minutos\}::int\)/,
    "lo recién guardado no cuenta, aunque Instagram diga que se escribió hace rato");
  assert.match(fn, /m\.id > c\.respondido_hasta AS abierto/, "el turno cerrado no es silencio");
  assert.match(fn, /COUNT\(DISTINCT contacto\)::int FROM vistos\) AS leads/);
  assert.match(fn, /FILTER \(WHERE estado = 'enviada'\)::int AS enviadas/, "lo que no salió (callar, una nota del repaso) no tapa al agente mudo");
});

test("un envío que falló cerró el turno, pero no salió nada: avisa igual (el 31/10 fueron uno o dos por ventana)", async () => {
  // El CV por DM que queda incierto cierra el turno y sigue siendo del agente; una respuesta que falla además le pasa la
  // charla a Cande. En los dos casos no queda nada pendiente, y la falla es justo lo que el reloj tiene que ver.
  for (const pulso of [
    { leads: 1, pendientes: 0, enviadas: 0, inciertas: 1, errores: 0 },
    { leads: 0, pendientes: 0, enviadas: 0, inciertas: 1, errores: 1 },
  ]) {
    const d = armar(pulso);
    const r = await vigilarEnvios(d);
    assert.equal(r.aviso, true, JSON.stringify(pulso));
    assert.equal(r.mudo, true);
    assert.match(d.avisos[0].campos.Qué, /no llegaron y 0 sí/);
  }
});

test("una solicitud sin aceptar no es el envío roto: no cuenta como falla ni como sin atender", async () => {
  // Con la gente nueva entrando sin ManyChat, la que escribe desde Solicitudes queda del agente con el turno abierto
  // hasta que Cande la acepta, y a ella ya le llega "aceptale la solicitud". Sin esto, cada una de noche era una alarma.
  const { readFile } = await import("node:fs/promises");
  const src = await readFile(new URL("../lib/dm/base.js", import.meta.url), "utf8");
  const fn = src.slice(src.indexOf("export async function pulsoEnvios"), src.indexOf("export async function marcarIgBuscado"));
  assert.match(fn, /NOT EXISTS \(\s*SELECT 1 FROM dm_salidas e\s*WHERE e\.contacto = c\.id AND e\.estado = 'error' AND e\.detalle LIKE \$\{`\$\{SIN_ACEPTAR\}%`\}/);
  assert.match(fn, /estado = 'error' AND COALESCE\(detalle, ''\) NOT LIKE \$\{`\$\{SIN_ACEPTAR\}%`\}\)::int AS errores/);
});
