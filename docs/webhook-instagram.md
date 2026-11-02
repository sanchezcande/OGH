# Webhook de comentarios de Instagram

Para que el DM con la lista de developers salga a los segundos del comentario y no en la vuelta
siguiente del cron (hasta 15 minutos). Es lo que hacía ManyChat para llegar a los 7 segundos.

El endpoint ya está en el sitio: `pages/api/ig/webhook.js`. Hasta que se hagan estos pasos queda
inerte (sin las claves, ninguna firma vale y la verificación no contesta) y los comentarios los
sigue contestando el cron de `/api/dm/comentarios` cada 15 minutos, que no se saca nunca: es la red
por si un aviso de Meta se pierde.

La app de Meta es **Metrics** (ID `1009334891923050`): la misma con la que el sitio publica y contesta
los comentarios. Es la que tiene el permiso `instagram_manage_comments`.

## 1. Las dos claves en Vercel

1. App Secret: developers.facebook.com/apps/1009334891923050/settings/basic/ > "Clave secreta de la
   app" > Mostrar (pide la contraseña de Facebook) > copiar.
2. En Vercel, proyecto del sitio, Settings > Environment Variables, para Production:

| Variable | Qué va |
| --- | --- |
| `IG_APP_SECRET` | La clave secreta del paso 1. Es con la que Meta firma cada aviso. |
| `IG_WEBHOOK_VERIFY_TOKEN` | Un texto inventado, cualquiera y largo. Se usa una sola vez, en el paso 2, para que Meta y el sitio se reconozcan. |

3. Redeploy (Deployments > el último > Redeploy): las variables entran al deploy y no a la función
   que ya está corriendo.
4. Comprobar que el sitio quedó listo (sin el token mal contesta 403, con el bueno devuelve `hola`):

       curl -i "https://www.opengatehub.com/api/ig/webhook?hub.mode=subscribe&hub.verify_token=<EL_TOKEN>&hub.challenge=hola"

## 2. El alta del webhook en la app de Meta

0. Antes: la app tiene que estar en modo **Activo** (el interruptor de arriba del panel). En modo de
   desarrollo Meta solo manda los avisos de quienes tienen un rol en la app, y los comentarios de los
   leads no llegan.

En developers.facebook.com/apps/1009334891923050/webhooks/:

1. Objeto: **Instagram** > Suscribirse a este objeto.
2. URL de devolución de llamada:

       https://www.opengatehub.com/api/ig/webhook

   Con `www`. Sin `www` el dominio redirige con un 308 y en el salto se pierden el cuerpo y la firma.
3. Token de verificación: el mismo texto que quedó en `IG_WEBHOOK_VERIFY_TOKEN`.
4. Verificar y guardar. Meta hace un GET a esa URL en el momento: si las dos claves están bien, le
   contesta el challenge y queda verificada. Si dice que no pudo validar, casi siempre es que el
   redeploy del paso 1 todavía no terminó.
5. En la lista de campos del objeto Instagram, poner en "Suscrito" **comments**. Los demás no hacen
   falta (los mensajes siguen entrando por la bandeja y por el agente).

La página de la cuenta también tiene que estar suscrita a la app. El 02/11 `GET /{página}/subscribed_apps`
daba una lista vacía. Si después del alta no llega ningún aviso, mirar eso primero:

```bash
curl "https://graph.facebook.com/v23.0/<ID_DE_LA_PAGINA>/subscribed_apps?access_token=<TOKEN_DE_LA_PAGINA>"
```

Y si sigue vacía, suscribirla con un POST que se hace una sola vez (el campo que acepte la página;
Meta lista los válidos en el error si se pone uno que no):

```bash
curl -X POST "https://graph.facebook.com/v23.0/<ID_DE_LA_PAGINA>/subscribed_apps?subscribed_fields=feed&access_token=<TOKEN_DE_LA_PAGINA>"
```

## 3. Antes de prenderlo: ManyChat

Cande dio de baja ManyChat el 02/11 (el plan vence el 05/11). Mientras su automático de CV siga
contestando a contactos viejos, los dos contestan el mismo comentario y el lead recibe el link dos
veces (pasó el 30/10). Instagram no lo impide. Si pasa, el webhook se apaga dejando `dm_config`
`comentarios` en `{ "activo": true, "webhook": false }`: así contesta solo el cron, que antes de
mandar mira la bandeja. Cuando ManyChat ya no conteste, `FRESCO_MINUTOS` (lib/dm/comentarios.js) va a 0.

## 4. Probar que quedó andando

- La verificación, desde cualquier lado:

      curl -i "https://www.opengatehub.com/api/ig/webhook?hub.mode=subscribe&hub.verify_token=<EL_TOKEN>&hub.challenge=hola"

  Tiene que contestar `200` y el cuerpo `hola`. Con el token mal, `403`.
- Un POST sin firma tiene que contestar `401`.
- La prueba de verdad: comentar `CV` desde otra cuenta en un reel y ver que el DM llega en segundos.
  En Meta, Webhooks > Probar muestra los avisos que se mandaron y con qué respuesta.

## Cómo se apaga

- Todo (webhook y cron): `dm_config` `comentarios` en `{ "activo": false }`.
- Solo el webhook: `{ "webhook": false }`.
- Del lado de Meta: desuscribir el campo `comments`.

## Qué comentarios no ve el cron (02/11)

El cron lee `/{medio}/comments`, y esa lista NO trae todos los comentarios: el 02/11, en los últimos 56
medios con comentarios, `comments_count` sumaba 1.324 y la API devolvía 868 entre comentarios y
respuestas. Se paginó a mano con límites de 1 a 100, con el token de usuario y el de la página y con las
versiones v19 a v25 de la API: siempre los mismos. Instagram los filtra del lado de ellos y no hay
parámetro que los traiga (`hidden` da siempre falso). Si el webhook los entrega, es la vía; si no, solo
quedan los que Cande copie desde la app (ver HANDOFF).

Cuando el webhook ande, la prueba que falta es esa: que un `CV` de alguien que `/comments` no devuelve
llegue por acá.
