// Número de lugares que se muestra en el CTA de "9 de las preguntas" (PDF,
// landing /preguntas y mail de entrega). Rota SOLO por semana, no por visita:
// así el PDF, la landing y el mail dicen siempre el mismo número mientras
// dure la semana, y nadie ve un "quedan 2" que después ve "quedan 3" al
// recargar. Cande, 18/09: rango real 1 a 3 lugares por semana.
const RANGO = [3, 2, 1];

function isoWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}

export function cuposSemana(fecha = new Date()) {
  return RANGO[isoWeek(fecha) % RANGO.length];
}

// "Quedan 2" pero "Queda 1": el número solo no alcanza, hay que conjugar.
export function fraseCupos(fecha = new Date()) {
  const n = cuposSemana(fecha);
  return n === 1 ? `Queda ${n} esta semana` : `Quedan ${n} esta semana`;
}
