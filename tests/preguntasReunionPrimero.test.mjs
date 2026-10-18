// /preguntas?o=hola con la reunión primero (19/10/2026). El founder que toca "quiero contratar" en
// /hola ya quiere hablar: la reunión gratis va arriba, un solo formulario con dos botones (el grande
// pide la reunión y muestra la agenda en la página, el de texto se lleva solo la guía), y el aviso de
// Telegram dice cuál eligió. La versión de LinkedIn (sin ?o=hola) no cambia.
//
// La página se prueba leyendo el código, como el resto de las pruebas de /preguntas. La API y
// /api/evento se corren de verdad contra los dobles de tests/dobles (sin red, sin base, sin mails).
//
// Correr:  node --test tests/*.test.mjs
import { avisos, respuesta } from "./dobles/preparar.mjs";
import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { resendFalso } from "./dobles/resend.mjs";

const { default: preguntasLead } = await import("../pages/api/preguntas-lead.js");
const { default: eventoApi } = await import("../pages/api/evento.js");

const leer = (p) => fs.readFile(new URL(p, import.meta.url), "utf8");
const pagina = () => leer("../pages/preguntas.jsx");

/** Lo que va entre `{deHola ? (` y `) : (`: el encabezado de la variante de hola. */
async function encabezados() {
  const src = await pagina();
  const i = src.indexOf("{deHola ? (");
  const j = src.indexOf(") : (", i);
  const k = src.indexOf("{estado !== \"listo\"", j);
  assert.ok(i > -1 && j > i && k > j, "cambió la forma de partir las dos variantes en la página");
  return { src, hola: src.slice(i, j), linkedin: src.slice(j, k) };
}

beforeEach(() => {
  avisos.length = 0;
  resendFalso.reiniciar();
});

// ---------- La página ----------

test("con ?o=hola la reunión va primero: foto, título de la reunión y después el formulario", async () => {
  const { src, hola } = await encabezados();
  const orden = [
    'src="/images/cande-2026.jpg"',
    "Candelaria Sanchez",
    "Founder de OpenGateHub",
    "Para founders que quieren contratar un developer",
    "Agendá una reunión <Coral>gratis</Coral> conmigo",
    "en 30 minutos te dejo un plan concreto",
  ].map((t) => [t, hola.indexOf(t)]);
  for (const [t, i] of orden) assert.ok(i > -1, `falta en el encabezado de hola: ${t}`);
  for (let n = 1; n < orden.length; n++) {
    assert.ok(orden[n][1] > orden[n - 1][1], `fuera de orden: "${orden[n][0]}" antes que "${orden[n - 1][0]}"`);
  }

  // Dentro del formulario: los cupos y el pedido arriba, después los campos, y la reunión antes que la guía.
  const form = src.slice(src.indexOf("<Form onSubmit={enviar}"), src.indexOf("</Form>"));
  const pos = (t) => {
    const i = form.indexOf(t);
    assert.ok(i > -1, `falta en el formulario: ${t}`);
    return i;
  };
  assert.ok(pos("Son pocos lugares. {cupos}.") < pos("Dejame tus datos y elegí tu horario"));
  assert.ok(pos("Dejame tus datos y elegí tu horario") < pos('htmlFor="nombre"'));
  assert.ok(pos('htmlFor="whatsapp"') < pos('value="reunion"'));
  assert.ok(pos('value="reunion"') < pos("Todavía no estás por contratar?"));
  assert.ok(pos("Todavía no estás por contratar?") < pos('value="guia"'));

  // Lo que se sacó en esta versión no vuelve: ni la guía como pedido principal ni el link suelto a la agenda.
  for (const viejo of ["Poné tus datos y descargá la guía", "Descargá la guía gratis", "O agendá directamente", "<Alterna"]) {
    assert.ok(!src.includes(viejo), `volvió la versión con la guía primero: ${viejo}`);
  }
});

test("los dos botones mandan el mismo formulario, cada uno con su value", async () => {
  const src = await pagina();
  assert.match(src, /<BotonForm type="submit" name="quiere" value="reunion"[^>]*>[\s\S]{0,120}"Quiero mi reunión gratis →"/);
  assert.match(src, /<BotonTexto type="submit" name="quiere" value="guia"[^>]*>[\s\S]{0,120}"Descargá la guía y seguimos en contacto\\u00a0→"/);
  // Antes del botón se presenta qué guía es.
  assert.ok(src.indexOf("Empezá por mi guía gratis: <b>9 de las preguntas que hago para entrevistar a un developer</b>") > -1);
  assert.ok(src.indexOf("Empezá por mi guía gratis") < src.indexOf('<BotonTexto type="submit" name="quiere" value="guia"'), "la guía se presenta antes del botón");
  // Un solo formulario: dos botones de envío, no dos <Form>.
  assert.equal(src.split("<Form onSubmit={enviar}").length - 1, 1);
  // Qué botón apretó sale del submitter, y si no viene nada (Enter, navegador viejo) es la reunión.
  assert.match(src, /e\.nativeEvent\?\.submitter\?\.value === "guia" \? "guia" : "reunion"/);
  // Solo con ?o=hola: el de LinkedIn no elige nada y su aviso no lleva la línea.
  assert.match(src, /const pide = deHola \? /);
  // Viaja en el mismo POST, sin llaves adentro (lo exige founderDejaWhatsapp).
  assert.match(src, /body: JSON\.stringify\(\{[^}]*whatsapp[^}]*quiere: pide[^}]*\}\)/);
});

test("si pidió la reunión ve la agenda en la página; si pidió la guía, la guía y la reunión para después", async () => {
  const src = await pagina();
  assert.match(src, /const AGENDA = "https:\/\/calendar\.google\.com\/calendar\/appointments\/schedules\/[A-Za-z0-9_-]+\?gv=true"/);
  const reunion = src.slice(src.indexOf("<Reunion ref={listoRef}>"), src.indexOf("</Reunion>"));
  assert.ok(reunion.length > 0, "falta el bloque de la reunión");
  assert.match(reunion, /<Agenda src=\{AGENDA\}/);
  assert.match(reunion, /Ahora elegí tu horario/);
  assert.match(reunion, /href=\{LLAMADA\} target="_blank"[^\n]*>\s*No te carga\? Abrí la agenda en otra pestaña →/);
  // El respaldo va arriba de la agenda: si el iframe queda en blanco, abajo queda tapado por un recuadro vacío.
  assert.ok(reunion.indexOf("No te carga?") < reunion.indexOf("<Agenda src={AGENDA}"), "el respaldo tiene que ir antes que la agenda");
  assert.match(reunion, /Si ningún horario te sirve, tranqui: te escribo por WhatsApp con dos opciones\./);
  assert.match(reunion, /href=\{PDF\}/, "el que pidió la reunión también tiene que poder bajar la guía");

  // La agenda entera, sin recuadro con scroll adentro: a 375 px Google apila calendario y horarios (unos
  // 1440 px). Con 720 los horarios quedaban escondidos abajo, adentro del iframe.
  const css = src.slice(src.indexOf("const Agenda = styled.iframe"));
  assert.match(css.slice(0, 400), /width: 100%; height: 1450px; border: 0;/);

  const i = src.indexOf(": deHola ? (", src.indexOf("</Reunion>"));
  const guia = src.slice(i, src.indexOf("</Listo>", i));
  assert.ok(i > -1, "falta el bloque de la guía de hola");
  assert.match(guia, /Te la mandé a tu mail/);
  assert.match(guia, /Seguimos en contacto por WhatsApp\./);
  assert.match(guia, /<CuposCoral>Son pocos lugares\. \{cupos\}\.<\/CuposCoral>/);
  assert.match(guia, /href=\{LLAMADA\}[^\n]*evento\("preguntas_llamada_click_hola"\)\}>\s*Agendá tu reunión gratis →/);
});

test("los títulos de hola van en Helvetica negrita y los de LinkedIn siguen en Charter", async () => {
  const { src, hola } = await encabezados();
  // Cande, 19/10: la serif en un título le quedó rara (cartel de pesos, #84). Con hola no va serif.
  assert.match(hola, /<H1Hola>Agendá una reunión <Coral>gratis<\/Coral> conmigo<\/H1Hola>/);
  assert.ok(!/<H1>/.test(hola), "el título de hola no puede usar el H1 en Charter");
  const estilo = (n) => {
    const i = src.indexOf(`const ${n} = styled(`);
    assert.ok(i > -1, `falta ${n}`);
    return src.slice(i, src.indexOf("`;", i));
  };
  for (const n of ["H1Hola", "H2Hola"]) {
    assert.match(estilo(n), /font-family: \$\{SANS\}/, `${n} tiene que ir en Helvetica`);
    assert.ok(!/letter-spacing: -/.test(estilo(n)), `${n} sin letter-spacing negativo`);
  }
  // Los "listo" de hola usan H2Hola; el H2 en Charter queda solo para LinkedIn.
  const listos = src.slice(src.indexOf("</Form>"), src.lastIndexOf("<Listo>"));
  assert.ok(!/<H2>/.test(listos), "un título de listo de hola quedó en Charter");
  assert.match(src.slice(src.lastIndexOf("<Listo>")), /<H2>\{mandado \? "Listo, revisá tu mail"/);
});

test("los eventos nuevos se mandan donde corresponde", async () => {
  const src = await pagina();
  // Literales, para que foundersNoSePierden los encuentre y los cruce con la API.
  assert.match(src, /if \(pide === "reunion"\) evento\("preguntas_reunion_pedida_hola"\);/);
  assert.match(src, /if \(pide === "guia"\) evento\("preguntas_guia_pedida_hola"\);/);
  assert.match(src, /<Agenda [^>]*onLoad=\{\(\) => evento\("preguntas_agenda_vista_hola"\)\}/);
  // Solo después de que el envío salió bien.
  const ok = src.indexOf('setEstado("listo");');
  assert.ok(ok > -1 && src.indexOf('evento("preguntas_reunion_pedida_hola")') > ok);
  assert.ok(src.indexOf('evento("preguntas_guia_pedida_hola")') > ok);
});

// ---------- /api/evento ----------

test("la API acepta las tres fases nuevas y no cualquier cosa parecida", async () => {
  const api = await leer("../pages/api/evento.js");
  for (const fase of ["preguntas_reunion_pedida_hola", "preguntas_guia_pedida_hola", "preguntas_agenda_vista_hola"]) {
    assert.ok(api.includes(`"${fase}"`), `${fase} no está en FASES`);
    const res = respuesta();
    await eventoApi({ method: "POST", body: { fase, sid: "prueba" } }, res);
    assert.equal(res.codigo, 200, `${fase} da ${res.codigo}: se perdería en silencio`);
  }
  for (const mala of ["preguntas_reunion_pedida", "preguntas_otra_pedida_hola", "preguntas_agenda_vista_hola_ig"]) {
    const res = respuesta();
    await eventoApi({ method: "POST", body: { fase: mala } }, res);
    assert.equal(res.codigo, 400, `la API acepta ${mala} y no debería`);
  }
});

// ---------- /api/preguntas-lead ----------

/** Manda el formulario como lo manda la página y devuelve el aviso que le llegó a Cande. */
async function mandar(extra) {
  const res = respuesta();
  await preguntasLead({
    method: "POST",
    body: { nombre: "Martín", email: "martin@example.com", whatsapp: "+54 9 11 1234 5678", origen: "hola", ...extra },
  }, res);
  assert.equal(res.codigo, 200);
  assert.equal(avisos.length, 1, "tiene que salir exactamente un aviso");
  return avisos[0];
}

test("el aviso dice qué eligió, justo después de Origen, sin cambiar el título", async () => {
  for (const [valor, texto] of [["reunion", "reunión"], ["guia", "guía"]]) {
    avisos.length = 0;
    const aviso = await mandar({ quiere: valor });
    assert.match(aviso, /<b>Founder bajó las 9 preguntas<\/b>/);
    assert.match(aviso, new RegExp(`<b>Origen:</b> hola\\n<b>Quiere:</b> ${texto}\\n`));
  }
});

test("quiere solo acepta reunion o guia: cualquier otra cosa no llega al aviso", async () => {
  for (const malo of [undefined, "", "Reunion", "reunión", "llamada", ["reunion"], { reunion: true }, 1]) {
    avisos.length = 0;
    const aviso = await mandar({ quiere: malo });
    assert.ok(!aviso.includes("Quiere"), `entró ${JSON.stringify(malo)}: ${aviso}`);
    // El resto del aviso sigue igual.
    assert.match(aviso, /<b>WhatsApp:<\/b> \+54 9 11 1234 5678/);
  }
});

// ---------- La variante de LinkedIn ----------

test("la variante de LinkedIn (sin ?o=hola) no cambió", async () => {
  const { src, linkedin } = await encabezados();
  for (const t of [
    "<Kicker>Guía gratis para founders</Kicker>",
    "<H1>9 de las preguntas que hago para entrevistar a un developer</H1>",
    "No hace falta que seas técnico. Cada pregunta viene con lo que tenés que escuchar en la respuesta.",
    "<li><b>Qué mide</b> cada pregunta</li>",
    "<li><b>Buenas y malas señales</b> en la respuesta</li>",
    "<li><b>La repregunta</b> que separa al que lo vivió del que preparó la entrevista</li>",
  ]) assert.ok(linkedin.includes(t), `cambió el encabezado de LinkedIn: ${t}`);

  // Formulario: nombre y mail, sin WhatsApp, su botón y su texto chico de siempre.
  assert.match(src, /\{enviando \? "Enviando…" : "Mandámelas por mail →"\}/);
  assert.match(src, /<Chico>Te llega en un minuto\. Si no lo ves, fijate en spam o promociones\.<\/Chico>/);

  // Después de mandar: lo mismo que antes, solo sin el signo de apertura.
  const i = src.lastIndexOf("<Listo>");
  const listo = src.slice(i, src.indexOf("</Listo>", i));
  assert.match(listo, /\{mandado \? "Listo, revisá tu mail" : "Listo, acá la tenés"\}/);
  assert.match(listo, /<p><b>Estás por contratar a tu developer\?<\/b><\/p>/);
  assert.match(listo, /Son pocos lugares\. \{cupos\}\. Reservá el tuyo\./);
  assert.match(listo, /evento\("preguntas_llamada_click"\)\}>\s*Agendá tu llamada gratis →/);

  // La firma de abajo sigue para LinkedIn (con hola el nombre ya está arriba, con la foto).
  assert.match(src, /\{!deHola && \(\s*<Firma>\s*<b>Candelaria Sanchez<\/b>\s*<span>Founder, OpenGateHub<\/span>/);
});

test("sin signos de apertura ni guion largo en la página", async () => {
  const src = await pagina();
  assert.ok(!/[¿¡—]/.test(src), "hay un ¿, un ¡ o un — en pages/preguntas.jsx");
});
