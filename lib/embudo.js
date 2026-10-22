// Medición del embudo de devs, lado navegador. Anónimo: un id aleatorio por
// navegador (localStorage) para poder contar personas únicas, nada personal.
// sendBeacon: no bloquea la navegación y sobrevive al cierre de la pestaña.
export function sid() {
  try {
    let s = localStorage.getItem("ogh_sid");
    if (!s) {
      s = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("ogh_sid", s);
    }
    return s;
  } catch {
    return null;
  }
}

const mandadas = new Set(); // no repetir la misma fase en la misma carga

// `charla` ({ ig, firma }): el id de la charla de Instagram y su firma, si la persona llegó con el link del agente
// (lib/dm/linkFormulario.js, idDeLaPestana). Solo lo manda /devs/gracias, y la API lo usa solo si la firma coincide.
export function evento(fase, charla = null) {
  try {
    if (mandadas.has(fase)) return;
    mandadas.add(fase);
    const conCharla = charla?.ig ? { ig: String(charla.ig), firma: String(charla.firma || "") } : {};
    const body = JSON.stringify({ fase, sid: sid(), ...conCharla });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/evento", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/evento", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    }
  } catch {}
}
