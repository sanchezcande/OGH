// Doble de "resend". Respeta el contrato del SDK 6.7.0 (node_modules/resend/dist/index.mjs,
// fetchRequest): emails.send() NO tira excepción cuando la API rechaza, devuelve
// { data: null, error: { name, message, statusCode }, headers }. Cuando acepta devuelve
// { data: { id }, error: null, headers }.
export const aceptado = (n) => ({ data: { id: `mail-${n}` }, error: null, headers: {} });
export const rechazo = (name, statusCode = 429) =>
  ({ data: null, error: { name, statusCode, message: `rechazo de prueba: ${name}` }, headers: {} });

export const resendFalso = {
  pedidos: [],     // cada mail que el código intentó mandar, en orden
  aceptados: [],   // los "to" que este doble aceptó
  responder: null, // (mail, numeroDePedido) => respuesta; sin esto, acepta todo
  reiniciar() {
    this.pedidos = [];
    this.aceptados = [];
    this.responder = null;
  },
};

export class Resend {
  constructor(key) {
    this.key = key;
    this.emails = {
      send: async (mail) => {
        resendFalso.pedidos.push(mail);
        const n = resendFalso.pedidos.length;
        const r = resendFalso.responder ? resendFalso.responder(mail, n) : aceptado(n);
        if (!r.error && r.data?.id) resendFalso.aceptados.push(mail.to);
        return r;
      },
    };
  }
}
