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

export function evento(fase) {
  try {
    if (mandadas.has(fase)) return;
    mandadas.add(fase);
    const body = JSON.stringify({ fase, sid: sid() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/evento", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/evento", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    }
  } catch {}
}
