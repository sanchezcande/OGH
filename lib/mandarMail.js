// Envío por Resend que se entera cuando el mail NO salió. Lo usan los dos goteos
// (pages/api/drip.js y pages/api/drip-preguntas.js) y pedirCV.
//
// resend.emails.send() no tira excepción cuando la API rechaza un mail: devuelve
// { data: null, error: { name, message, statusCode } } y el código sigue de largo.
// Hasta el 06/10/2026 nadie miraba ese error: el goteo anotaba el toque como mandado
// igual, así que un mail rechazado no se reintentaba nunca ni dejaba rastro (el 05/10
// se intentaron 128 con un cupo de 100 por día).
// Regla: un mail cuenta como mandado SOLO si Resend lo aceptó (sin error y con id).

// Cupo agotado (plan gratis de Resend: 100 mails por día). Seguir intentando no sirve.
const SIN_CUPO = ["daily_quota_exceeded", "monthly_quota_exceeded"];
// Resend acepta hasta 10 pedidos por segundo. Con esta pausa entre envíos van 8 como mucho.
const PAUSA_MS = 125;
// Si igual contesta que vamos muy rápido: esperar un segundo, después dos, y recién ahí soltar.
const REINTENTOS = 2;

const dormir = (ms) => new Promise((ok) => setTimeout(ok, ms));

/**
 * Manda UN mail. Devuelve { ok: true, id } si Resend lo aceptó, o
 * { ok: false, motivo: "cupo" | "velocidad" | "otro", error } con el nombre del error.
 */
export async function mandarMail(resend, mail, esperar = dormir) {
  for (let intento = 0; ; intento++) {
    let r;
    try {
      r = await resend.emails.send(mail);
    } catch (e) {
      console.error("mandarMail: Resend tiró una excepción:", e.message);
      return { ok: false, motivo: "otro", error: "excepcion" };
    }
    if (!r?.error && r?.data?.id) return { ok: true, id: r.data.id };
    const error = typeof r?.error?.name === "string" ? r.error.name : "respuesta_inesperada";
    if (SIN_CUPO.includes(error)) return { ok: false, motivo: "cupo", error };
    if (error !== "rate_limit_exceeded") return { ok: false, motivo: "otro", error };
    if (intento === REINTENTOS) return { ok: false, motivo: "velocidad", error };
    await esperar(1000 * (intento + 1));
  }
}

const MOTIVOS = {
  daily_quota_exceeded: "Se acabó el cupo de mails del día en Resend",
  monthly_quota_exceeded: "Se acabó el cupo de mails del mes en Resend",
  tiempo: "Se acabó el tiempo de la corrida",
};

/**
 * Corre un goteo entero: arma la fila, manda de a uno y anota lo que salió.
 * Lo que cambia entre cadenas lo pasa cada endpoint:
 *   buscar(t)    → las filas que tienen pendiente el toque t, las que más esperan primero
 *   armar(t, r)  → el mail de ese toque para esa fila (lo que recibe resend.emails.send)
 *   anotar(t, r) → marca el toque como mandado en la base
 *   limite       → hora (ms) a partir de la cual no arranca ningún envío más
 * Devuelve lo que el cron contesta en el JSON.
 */
export async function correrGoteo({ cadena, toques, buscar, armar, anotar, resend, avisar, limite,
                                    esperar = dormir, ahora = Date.now }) {
  // Primero se arma la fila entera y recién después se manda: así, si la corrida se
  // corta, se sabe cuántos quedaron sin intentar.
  // Máximo UN mail por persona por corrida: si alguien entró con días acumulados,
  // recibe la escalera de a un escalón por día, nunca todos juntos.
  const enviados = {};
  const fila = [];
  const enFila = new Set();
  for (const t of toques) {
    enviados[t.col] = 0;
    for (const r of await buscar(t)) {
      if (enFila.has(r.id)) continue;
      enFila.add(r.id);
      fila.push({ t, r });
    }
  }

  const fallaron = {};   // cuántos por nombre de error, sin datos de nadie
  let salieron = 0, intentados = 0, cortado = null, motivo = null;
  for (const { t, r } of fila) {
    if (ahora() > limite) { cortado = motivo = "tiempo"; break; }
    if (intentados) await esperar(PAUSA_MS);
    intentados++;
    let m;
    try {
      m = await mandarMail(resend, armar(t, r), esperar);
      // El toque se anota SOLO si Resend aceptó el mail.
      if (m.ok) await anotar(t, r);
    } catch (e) {
      // No es un rechazo de Resend: falló armar el mail o el UPDATE.
      m = { ok: false, motivo: "otro", error: "excepcion", detalle: e.message };
    }
    if (m.ok) { enviados[t.col]++; salieron++; continue; }
    fallaron[m.error] = (fallaron[m.error] || 0) + 1;
    // Sin cupo no sale ninguno más: se corta acá y lo que falta queda para la corrida siguiente.
    if (m.motivo === "cupo") { cortado = "cupo"; motivo = m.error; break; }
    // Cualquier otra falla: ese toque queda pendiente, sin anotar, y la corrida sigue.
    // Se registra el id de la fila y el nombre del error, no el mail de la persona.
    console.error(`goteo ${cadena} ${t.col} id ${r.id}: no quedó anotado (${m.error})`, m.detalle || "");
  }

  const sinIntentar = fila.length - intentados;
  if (cortado) {
    console.error(`goteo ${cadena}: se cortó (${motivo}), salieron ${salieron}, sin intentar ${sinIntentar}`);
    await avisar(`Se cortó la cadena de mails a ${cadena}`, {
      Motivo: MOTIVOS[motivo],
      Salieron: salieron,
      "Quedaron sin salir": fila.length - salieron,
      // La fila arranca siempre por el primer mail de la cadena: si el cupo no alcanza, los que
      // quedan afuera son los últimos mails (y la cadena que corre después). No prometer otra cosa.
      "Qué sigue": "Quedan pendientes, sin anotar, para las próximas corridas. Si el cupo sigue sin alcanzar, vuelven a quedar afuera los últimos mails de la cadena.",
    });
  } else if (fila.length && !salieron) {
    // Había mails para mandar y no salió ninguno por algo que no es el cupo (clave, dominio,
    // Resend caído): sin este aviso quedaba solo en los logs, que es el silencio que se quiso sacar.
    const masRepetido = Object.entries(fallaron).sort((a, b) => b[1] - a[1])[0];
    console.error(`goteo ${cadena}: no salió ninguno de ${fila.length} (${masRepetido ? masRepetido[0] : "sin detalle"})`);
    await avisar(`No salió ningún mail de la cadena a ${cadena}`, {
      Motivo: `Resend rechazó los envíos (${masRepetido ? masRepetido[0] : "sin detalle"})`,
      Intentados: intentados,
      "Qué sigue": "Quedan pendientes, sin anotar. Hay que mirar los logs de la función en Vercel.",
    });
  }
  return { enviados, salieron, cortado, sinIntentar, fallaron };
}
