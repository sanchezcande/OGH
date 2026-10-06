// Lo primero que importa cada prueba. Deja el proceso sin salida a ningún servicio real:
// los paquetes de Resend y Postgres pasan a ser dobles (hooks.mjs), fetch solo "habla" con
// un Telegram de mentira, y las claves del entorno se pisan con valores de prueba.
import { register } from "node:module";

register("./hooks.mjs", import.meta.url);

process.env.RESEND_API_KEY = "clave-de-prueba";
process.env.TELEGRAM_BOT_TOKEN = "token-de-prueba";
process.env.TELEGRAM_CHAT_ID = "1";
for (const k of ["CRON_SECRET", "POSTGRES_URL", "DEVS_MAIL_FROM", "DEVS_MAIL_REPLYTO", "PREGUNTAS_MAIL_REPLYTO"]) {
  delete process.env[k];
}

// lib/notificar.js manda el aviso con fetch. Acá queda anotado el texto y no sale nada.
export const avisos = [];
globalThis.fetch = async (url, opciones) => {
  if (!String(url).startsWith("https://api.telegram.org/")) {
    throw new Error("las pruebas no usan la red");
  }
  avisos.push(JSON.parse(opciones.body).text);
  return { ok: true, status: 200, text: async () => "" };
};

// Lo que el código registra con console.error: se guarda para poder mirarlo.
export const registros = [];
console.error = (...partes) => { registros.push(partes.join(" ")); };

/** Un `res` de Next de mentira: guarda el status y el JSON que contestó el endpoint. */
export const respuesta = () => ({
  codigo: null,
  cuerpo: null,
  status(codigo) { this.codigo = codigo; return this; },
  json(cuerpo) { this.cuerpo = cuerpo; return this; },
});
