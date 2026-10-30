// Lo que para los envíos automáticos en los formularios públicos.
//
// 30/10, Cande: "alguien está mandando 5mil tests a la cosa, habría que poner un captcha al form".
// Hasta hoy ningún endpoint de formulario miraba de dónde venía el pedido: cualquiera con un script
// podía pegarle a /api/devs-red o /api/send-estimate mil veces por minuto. Y cada envío cuesta plata
// de verdad: una fila en Neon (que ya se pasó de cuota una vez), un mail de Resend (100 por día en
// el plan gratis, hoy llegó al 100%) y un aviso de Telegram que ella lee uno por uno.
//
// El captcha del formulario de contacto no servía para nada: el widget estaba en la página, pero el
// token nunca viajaba en el pedido y la API nunca lo verificaba. O sea que molestaba al founder que
// escribe de verdad y al bot no, porque el bot no abre la página: le pega directo a la API.
//
// Así que son tres capas, de la más barata a la más cara, y las tres cortan ANTES de tocar la base,
// Resend o Telegram:
//
//   1. La trampa (honeypot): un campo escondido que una persona no ve y un bot llena. Si vino con
//      algo, es un bot. Se le contesta 200 como si todo hubiera salido bien: si le contestamos un
//      error, el que escribió el script lo corrige.
//   2. El reloj: la página manda cuándo se abrió. Llenar el formulario de devs lleva minutos; los
//      envíos de menos de dos segundos no los hace una persona.
//   3. El tope: cuántos envíos por IP y cuántos en total. Esto es lo único que para al que le pega
//      directo a la API, porque ahí no hay trampa ni reloj que valgan.
//
// Y arriba de todo, el captcha de verdad: si existe RECAPTCHA_SECRET en Vercel, el token se verifica
// contra Google y sin token no se guarda nada. Sin esa variable las otras tres capas siguen andando
// igual, así que el formulario nunca queda sin defensa.

/**
 * La IP del que manda, o null si el pedido no entró por el borde de Vercel.
 *
 * Vercel le pone x-real-ip y x-forwarded-for a todo lo que llega de internet, así que sin ninguno de
 * los dos el pedido es de acá adentro: `next dev` en su Mac o las pruebas. Ahí no se cuenta nada, y
 * está bien: ella tiene que poder mandar el formulario veinte veces seguidas probándolo.
 */
export function ipDe(req) {
  const h = req?.headers || {};
  // x-forwarded-for puede traer varias: la primera es la del cliente, las otras son proxies.
  const cadena = h["x-real-ip"] || String(h["x-forwarded-for"] || "").split(",")[0];
  return String(cadena || "").trim() || null;
}

/**
 * El guardia. `ahora` es inyectable para poder probar los topes sin esperar una hora.
 *
 * `porIp` y `enTotal` son por hora y por instancia de la función: Vercel levanta varias y cada una
 * tiene su propia cuenta. No es exacto a propósito: con una sola instancia caliente (que es lo que
 * pasa cuando alguien está martillando) alcanza para cortar, y no cuesta ni una consulta a la base.
 */
export function crearGuardia({ ahora = () => Date.now(), porIp = 6, enTotal = 60 } = {}) {
  const HORA = 60 * 60 * 1000;
  const porFuente = new Map();
  let todos = [];

  const limpiar = (lista, desde) => lista.filter((t) => t > desde);

  /** Cuenta este envío y dice si se pasó del tope. No cuenta los que ya rebotaron antes. */
  function anotar(ip) {
    const t = ahora();
    const desde = t - HORA;
    todos = limpiar(todos, desde);
    const mios = limpiar(porFuente.get(ip) || [], desde);
    todos.push(t);
    mios.push(t);
    porFuente.set(ip, mios);
    // Las IP viejas se van solas: si no mandó nada en una hora, no hace falta recordarla.
    for (const [otra, lista] of porFuente) {
      if (otra !== ip && !limpiar(lista, desde).length) porFuente.delete(otra);
    }
    if (mios.length > porIp) return `la misma IP mandó ${mios.length} en una hora`;
    if (todos.length > enTotal) return `llegaron ${todos.length} envíos en una hora`;
    return null;
  }

  return { anotar };
}

/** El guardia que usan las APIs. Uno por instancia, se arma la primera vez que entra un pedido. */
const guardia = crearGuardia();

/**
 * ¿Hay que dejar pasar este envío?
 *
 * Devuelve `{ ok: true }`, o lo que tiene que contestar el endpoint:
 *   - `{ ok: false, callar: true }`: era un bot. Contestale 200 y no guardes nada.
 *   - `{ ok: false, codigo, error }`: contestale ese código con ese mensaje (lo lee una persona).
 *
 * `segundos` es lo mínimo que puede tardar una persona en llenarlo (el formulario de devs son 15
 * campos: ahí sobra con 2, pero un formulario de dos campos se llena más rápido).
 * `captcha: true` exige el token de reCAPTCHA, pero solo si en Vercel está RECAPTCHA_SECRET.
 */
export async function revisar(req, { segundos = 2, captcha = false, guardia: g = guardia, pedir } = {}) {
  const b = req?.body || {};

  // 1. La trampa. Se llama `web` porque así se llamaba ya en /preguntas, que la tenía desde el 18/09:
  // un nombre por formulario sería un nombre para que el que escribe el script tenga que esquivar.
  if (String(b.web || "").trim()) return { ok: false, callar: true, motivo: "llenó la trampa" };

  // 2. El reloj. Si no vino (una página vieja en caché, alguien con JS a medias) no se bloquea:
  // perder un dev de verdad es peor que dejar pasar un bot, que igual tiene el tope encima.
  const t0 = Number(b.t0);
  if (Number.isFinite(t0) && t0 > 0) {
    const tardo = (Date.now() - t0) / 1000;
    if (tardo < segundos) return { ok: false, callar: true, motivo: `lo llenó en ${tardo.toFixed(1)}s` };
  }

  // 3. El tope. Solo para lo que entró de internet (ver ipDe).
  const ip = ipDe(req);
  const paso = ip ? g.anotar(ip) : null;
  if (paso) {
    console.warn("antispam: corté un envío porque", paso);
    return { ok: false, codigo: 429, error: "Probá de nuevo en un rato.", motivo: paso };
  }

  // 4. El captcha de verdad, si está configurado.
  if (captcha && process.env.RECAPTCHA_SECRET) {
    const r = await verificarCaptcha(b.captcha, ip, pedir);
    if (!r.ok) return { ok: false, codigo: 400, error: "Completá la verificación para poder enviar.", motivo: r.motivo };
  }

  return { ok: true };
}

/** Le pregunta a Google si el token es de una persona. Si Google no contesta, se deja pasar. */
export async function verificarCaptcha(token, ip, pedir = (...a) => fetch(...a)) {
  if (!String(token || "").trim()) return { ok: false, motivo: "vino sin token" };
  try {
    const cuerpo = new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET, response: String(token) });
    if (ip) cuerpo.set("remoteip", ip);
    const r = await pedir("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: cuerpo.toString(),
    });
    const j = await r.json();
    if (j?.success) return { ok: true };
    return { ok: false, motivo: `Google lo rechazó: ${(j?.["error-codes"] || []).join(", ") || "sin motivo"}` };
  } catch (e) {
    // Si el que se cayó es Google, el que escribe de verdad no puede quedar afuera: las otras capas
    // ya lo miraron. Queda en el log para que se vea si pasa seguido.
    console.error("antispam: no pude verificar el captcha:", e.message);
    return { ok: true };
  }
}
