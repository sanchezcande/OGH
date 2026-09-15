import { guardarDev, hayBase } from "../../lib/db";
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

  let guardado = false;
  let errBase = null;
  if (hayBase()) {
    try {
      await guardarDev(d);
      guardado = true;
    } catch (e) {
      errBase = e.message;
      console.error("devs-red: no pude guardar:", e.message);
    }
  } else {
    errBase = "sin POSTGRES_URL";
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
    Guardado: guardado ? "sí" : "NO",
    "Mail CV": mailCV ? "enviado" : "NO salió",
  });

  // _debug: solo para diagnóstico manual; no expone secretos, solo el mensaje de error.
  if (d._debug === "claude") return res.status(200).json({ ok: true, guardado, errBase });
  return res.status(200).json({ ok: true, guardado });
}
