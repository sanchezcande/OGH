import { guardarDev, hayBase } from "../../lib/db";
import { anotarFormularioLleno } from "../../lib/dm/base";
import { linkCharlaIg } from "../../lib/dm/instagram";
import { idDeLink } from "../../lib/dm/linkFormulario";
import { avisar } from "../../lib/notificar";
import { pedirCV } from "../../lib/pedirCV";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Sin "cv" ni "proyecto": el form nuevo no los pide (el CV se pide por email después).
const OBLIGATORIOS = ["nombre", "email", "pais", "roles", "seniority", "experiencia",
  "stack", "cuandoArrancas", "dedicacion", "tarifa", "situacion", "ingles",
  "clientesExt", "comoLlegaste", "whatsapp"];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const d = req.body || {};
  const vacio = (v) => (Array.isArray(v) ? !v.length : !String(v || "").trim());
  const falta = OBLIGATORIOS.find((k) => vacio(d[k]));
  if (falta) return res.status(400).json({ error: `Falta completar: ${falta}` });
  if (!EMAIL_RE.test(String(d.email).trim())) return res.status(400).json({ error: "Email inválido" });

  d.email = String(d.email).trim().toLowerCase();
  // El id de la charla de Instagram, si llegó con el link que le pasó el agente (/devs?ig=, ver
  // lib/dm/linkFormulario.js). La página ya lo manda limpio; acá se vuelve a mirar igual, también con un signo
  // pegado. Lo que no tenga el formato de un id no se guarda ni se usa.
  d.ig = idDeLink(d.ig);

  let guardado = false;
  let compartido = false;
  let errBase = null;
  if (hayBase()) {
    try {
      compartido = Boolean((await guardarDev(d))?.ig_compartido);
      guardado = true;
    } catch (e) {
      errBase = e.message;
      console.error("devs-red: no pude guardar:", e.message);
    }
  } else {
    errBase = "sin POSTGRES_URL";
  }

  // Vino de una charla con el agente: la charla queda con la nota de que ya llenó el formulario (así el agente
  // no se lo vuelve a preguntar) y el aviso dice de qué charla es. Al lead no le sale nada por esto. Si falla,
  // el formulario sigue como siempre: lo de la charla es un dato de más, no puede costar el lead.
  // El id viaja en claro: la nota queda solo si el lead quedó guardado, si a esa charla le salió el link con ese
  // id (lo mira anotarFormularioLleno) y si el link no lo usó ya otro mail (un link reenviado a un amigo).
  let charla; // undefined: no se pudo mirar; null: no hay charla con ese id
  if (d.ig && hayBase()) {
    try {
      charla = await anotarFormularioLleno(d.ig, { anotar: guardado && !compartido });
    } catch (e) {
      console.error("devs-red: no pude anotar el formulario en la charla:", e.message);
    }
  }

  const mailCV = await pedirCV(d.nombre, d.email);

  await avisar("Nuevo dev en la red", {
    Nombre: d.nombre,
    Email: d.email,
    Dónde: d.pais,
    Rol: [d.rolPrincipal || (d.roles || [])[0], d.seniority, d.experiencia].filter(Boolean).join(" · "),
    Stack: (d.stack || []).join(", "),
    Tarifa: d.tarifa ? `USD ${d.tarifa}/h` : null,
    Arranca: [d.cuandoArrancas, d.dedicacion].filter(Boolean).join(" · "),
    Inglés: d.ingles,
    "Llegó por": d.comoLlegaste,
    Instagram: d.ig ? charlaParaAviso(charla, compartido) : null,
    Guardado: guardado ? "sí" : "NO",
    "Mail CV": mailCV ? "enviado" : "NO salió",
  });

  // _debug: solo para diagnóstico manual; no expone secretos, solo el mensaje de error.
  if (d._debug === "claude") return res.status(200).json({ ok: true, guardado, errBase });
  return res.status(200).json({ ok: true, guardado });
}

/**
 * Lo que dice el aviso de la charla de Instagram de la que vino: el link que la abre y quién la lleva. Si el link
 * ya lo usó otro mail, o a esa charla nunca le salió, lo dice en vez de "ya habla con el agente": puede ser otra
 * persona con un link reenviado, y a esa sí hay que escribirle.
 */
function charlaParaAviso(charla, compartido) {
  if (charla === undefined) return "vino del link de una charla del agente, pero no la pude mirar en la base";
  if (charla === null) return "vino del link de una charla que no encuentro en la base del agente";
  const link = linkCharlaIg(charla.ig_usuario) || "sin usuario guardado";
  if (compartido) return `${link} · link compartido: ese link ya lo usó otro mail, puede no ser la persona de la charla`;
  if (!charla.link_enviado) return `${link} · a esa charla no le salió el link con este id: puede no ser la persona de la charla`;
  return `${link} · ${charla.dueno === "agente" ? "ya habla con el agente" : "la charla es tuya"}`;
}
