// Los formularios que protege el captcha invisible de Vercel (BotID).
//
// Esta lista la leen los dos lados y tiene que ser la misma, o no funciona nada:
//   - la página (pages/_document.js) usa estas rutas para saber a qué pedidos pegarles la prueba de
//     que quien los manda es un navegador de verdad;
//   - el servidor (lib/antispam.js) las mira al recibir.
// Si una ruta está en el servidor y no en la página, la API va a rechazar hasta a las personas.
//
// checkLevel "basic" está puesto a propósito: es el que no se cobra. El análisis profundo se cobra
// por llamada, así que si algún día se prende en el panel de Vercel, esto lo sigue dejando en basic.

export const RUTAS_PROTEGIDAS = [
  { path: "/api/devs-red", method: "POST", advancedOptions: { checkLevel: "basic" } },
  { path: "/api/send-estimate", method: "POST", advancedOptions: { checkLevel: "basic" } },
  { path: "/api/preguntas-lead", method: "POST", advancedOptions: { checkLevel: "basic" } },
  { path: "/api/devs-lead", method: "POST", advancedOptions: { checkLevel: "basic" } },
  { path: "/api/leads", method: "POST", advancedOptions: { checkLevel: "basic" } },
];
