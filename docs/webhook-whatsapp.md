# WhatsApp: recibir y contestar

**Lo primero, porque es lo que sorprende**: un número dado de alta en WhatsApp Business Platform
**desaparece de la app de WhatsApp**. No hay chat en el celular. Si alguien contesta un
recordatorio, ese mensaje llega a un webhook y a ningún otro lado. Por eso esto va antes de mandar
un solo recordatorio: si no, serían mensajes a gente que no te puede contestar.

Lo que hay en el sitio:

| Pieza | Qué hace |
| --- | --- |
| `pages/api/whatsapp/webhook.js` | Recibe los mensajes de Meta, los guarda y le avisa a Cande por Telegram. |
| `lib/whatsapp/base.js` | La bandeja (`wa_contactos`, `wa_mensajes`) en Neon. |
| `lib/whatsapp/respuestas.js` | Ella responde el aviso en Telegram y el texto sale tal cual por WhatsApp. |
| `lib/whatsapp/api.js` | El envío (Cloud API de Meta). |
| `tracker/recordatorio_llamadas.py` (repo Personal Brand) | El otro lado: los recordatorios de las llamadas, con plantilla. |

Hasta que se hagan los pasos de abajo queda todo inerte: sin las claves ninguna firma vale, la
verificación no contesta y el envío devuelve "falta el alta del número" sin caerse.

La app de Meta es **RealEstate WA Bot** (ID `1483985306438017`), en el portfolio **Propbotapp**
(`144710949918075`, verificado). La cuenta de mensajes es `1921482308505030`.

## 0. El número (esto lo destraba Cande)

El número que figura hoy en la cuenta, `+54 9 2945 417165`, es del papá de Cande y **no se usa**.
Hace falta un chip argentino nuevo, con un número que no esté usado en la app de WhatsApp: al darlo
de alta acá, deja de funcionar como WhatsApp normal.

Mientras no esté, el resto se puede dejar listo igual, menos el envío.

## 1. Las claves en Vercel

1. App Secret: developers.facebook.com/apps/1483985306438017/settings/basic/ > "Clave secreta de la
   app" > Mostrar (pide la contraseña de Facebook) > copiar.
2. Token permanente: en la configuración de WhatsApp de la app, un usuario del sistema con permiso
   `whatsapp_business_messaging` sobre esa cuenta. El token de prueba de 24 horas no sirve.
3. En Vercel, proyecto del sitio, Settings > Environment Variables, para Production:

| Variable | Qué va | Para qué |
| --- | --- | --- |
| `WHATSAPP_APP_SECRET` | La clave secreta del paso 1 | recibir: es con la que Meta firma cada aviso |
| `WHATSAPP_VERIFY_TOKEN` | Un texto inventado, cualquiera y largo | recibir: se usa una sola vez, en el alta del paso 2 |
| `WHATSAPP_TOKEN` | El token del paso 2 | mandar |
| `WHATSAPP_PHONE_NUMBER_ID` | El id del número dado de alta (NO el número) | mandar |

4. Redeploy (Deployments > el último > Redeploy): las variables entran al deploy y no a la función
   que ya está corriendo.
5. Comprobar que el sitio quedó listo (con el token mal contesta 403, con el bueno devuelve `hola`):

       curl -i "https://www.opengatehub.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=<EL_TOKEN>&hub.challenge=hola"

Las dos primeras alcanzan para recibir y avisar. Sin las dos últimas, cuando ella conteste desde
Telegram el bot le dice que el número todavía no está dado de alta, en vez de fallar callado.

## 2. El alta del webhook en la app de Meta

En developers.facebook.com/apps/1483985306438017/webhooks/:

1. Objeto: **WhatsApp Business Account** > Suscribirse a este objeto.
2. URL de devolución de llamada:

       https://www.opengatehub.com/api/whatsapp/webhook

   Con `www`. Sin `www` el dominio redirige con un 308 y en el salto se pierden el cuerpo y la firma.
3. Token de verificación: el mismo texto que quedó en `WHATSAPP_VERIFY_TOKEN`.
4. Verificar y guardar. Meta hace un GET a esa URL en el momento. Si dice que no pudo validar, casi
   siempre es que el redeploy del paso 1 todavía no terminó.
5. En la lista de campos, poner en "Suscrito" **messages**. Ese campo trae los mensajes entrantes y
   también los acuses de entrega (enviado, entregado, leído), que el sitio cuenta y no guarda.

## 3. Cómo se usa, del lado de Cande

1. Alguien le escribe al WhatsApp de la empresa.
2. Le llega un aviso al bot de Telegram del agente (el mismo de los DM), así:

       🔔 WhatsApp: te escribió Juan Perez

       Quién: Juan Perez (wa:5491122334455)
       Dijo: si, mañana puedo
       Contestar: respondé este mensaje con lo que querés que le llegue y sale tal cual por WhatsApp

3. Ella responde (desliza) ese aviso y escribe el mensaje. **Sale tal cual.** Por WhatsApp no
   redacta ningún agente: no es como el DM de Instagram, donde lo que escribe es una indicación y el
   agente arma el mensaje con su voz. Acá lo que escribe es el mensaje.
4. El bot le contesta `✓ Mandado a Juan Perez por WhatsApp`, o qué pasó si no salió.

## 4. La ventana de 24 horas

WhatsApp deja escribir texto libre solo hasta **24 horas** después del último mensaje de la persona.
Pasado eso, el único camino es una plantilla aprobada.

- Si ella contesta adentro de la ventana, sale.
- Si contesta tarde, el bot **no manda nada** y le dice por qué: cuándo le escribió esa persona, que
  WhatsApp corta a las 24 horas y que fuera de eso solo sale una plantilla. Queda anotado en la
  charla, así no se pierde lo que quiso mandar.
- Abrir una charla de cero (un recordatorio de una llamada) es siempre una plantilla, y eso lo manda
  `tracker/recordatorio_llamadas.py`, no el sitio.

## 5. Probar que quedó andando

- La verificación: el `curl` del paso 1.5. Tiene que contestar `200` y el cuerpo `hola`; con el token
  mal, `403`.
- Un POST sin firma tiene que contestar `401`.
- En Meta, WhatsApp > Configuración de la API > "Enviar mensaje de prueba" manda un entrante de
  mentira firmado de verdad: tiene que llegar el aviso a Telegram.
- La prueba de verdad: escribirle al número desde otro teléfono, ver el aviso en Telegram, contestar
  ahí y ver que llega.

Las pruebas automáticas (`npm test`) cubren la verificación por GET, una firma inválida, un mensaje
entrante, un reintento duplicado de Meta y el caso de pasadas las 24 horas:
`tests/whatsappWebhook.test.mjs`, `tests/whatsappRespuestas.test.mjs`, `tests/whatsappApi.test.mjs`.

## Antes del primer recordatorio de verdad

El formulario de reserva de la agenda tiene que avisar que el recordatorio llega por WhatsApp. Si
no, son mensajes a gente que dejó el teléfono para otra cosa, y eso es lo que hace que te reporten.

## Cómo se apaga

- Del lado de Meta: desuscribir el campo `messages` del objeto WhatsApp Business Account.
- Del lado del sitio: sacar `WHATSAPP_APP_SECRET` de Vercel y redeploy. Sin esa clave ninguna firma
  vale y no entra nada. Para que tampoco salga nada, sacar `WHATSAPP_TOKEN`.
