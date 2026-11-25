// La Mac carga acá las reservas de la agenda de 15 minutos (la rutina "recordatorio-llamadas", que
// corre cada 2 horas y lee el calendario de Google). La nube no puede leer la agenda sola: Google
// no da la dirección secreta en formato iCal de esta cuenta, así que la lista la trae la Mac.
//
// Esto NO manda nada: solo deja anotado a quién le toca y cuándo. El envío es /api/recordatorios/mandar.
import { mismoSecreto, secretoDe } from "../../../lib/dm/armado";
import { cuandoSale, datosDeLaReserva, usuarioIg } from "../../../lib/recordatorioLlamada";
import { guardarReserva, vencer } from "../../../lib/dm/recordatoriosBase";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "solo POST" });
  // El secreto es el de la cola de publicación (COLA_SECRET), que es con el que la Mac ya habla con
  // la nube en todo lo demás, igual que /api/dm/config. NO es DM_SECRETO: ese es el que manda
  // ManyChat en su webhook y la Mac no lo tiene, así que pedirlo acá daba 401 siempre (25/11/2026).
  if (!mismoSecreto(secretoDe(req), process.env.COLA_SECRET)) {
    return res.status(401).json({ error: "no" });
  }
  const reservas = Array.isArray(req.body?.reservas) ? req.body.reservas : null;
  if (!reservas) return res.status(400).json({ error: "falta reservas" });

  let cargadas = 0;
  let sinUsuario = 0;
  const errores = [];
  for (const r of reservas.slice(0, 50)) {
    const uid = String(r?.uid || "").trim();
    const cuando = r?.cuando ? new Date(r.cuando) : null;
    if (!uid || !cuando || Number.isNaN(cuando.getTime())) { errores.push("reserva sin uid o sin hora"); continue; }
    // El usuario puede venir ya separado (la rutina lo saca del campo del formulario) o adentro de
    // la descripción del evento, que es de donde sale todo lo demás.
    const d = datosDeLaReserva({ titulo: r?.titulo || "", descripcion: r?.descripcion || "" });
    const usuario = usuarioIg(r?.usuario) || d.usuario;
    if (!usuario) sinUsuario += 1;
    try {
      const ok = await guardarReserva({
        uid, nombre: r?.nombre || d.nombre, usuario,
        cuando: cuando.toISOString(), mandarA: cuandoSale(cuando).toISOString(), link: r?.link || null,
      });
      if (ok) cargadas += 1;
    } catch (e) {
      errores.push(String(e.message || e).slice(0, 200));
    }
  }
  let vencidas = 0;
  try {
    vencidas = await vencer();
  } catch (e) {
    errores.push(`no se pudieron vencer las viejas: ${String(e.message || e).slice(0, 120)}`);
  }
  return res.status(200).json({ ok: true, cargadas, sin_usuario: sinUsuario, vencidas, errores });
}
