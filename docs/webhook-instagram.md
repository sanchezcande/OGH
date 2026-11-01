# Webhook de comentarios de Instagram

Para que el DM con la lista de developers salga a los segundos del comentario y no en la vuelta
siguiente del cron (hasta 15 minutos). Es lo que hacía ManyChat para llegar a los 7 segundos.

El endpoint ya está en el sitio: `pages/api/ig/webhook.js`. Hasta que se hagan estos pasos queda
inerte (sin las claves, ninguna firma vale y la verificación no contesta) y los comentarios los
sigue contestando el cron de `/api/dm/comentarios` cada 15 minutos, que no se saca nunca: es la red
por si un aviso de Meta se pierde.

## 1. Las dos claves en Vercel

En Vercel, proyecto del sitio, Settings > Environment Variables, para Production:

| Variable | Qué va |
| --- | --- |
| `IG_APP_SECRET` | El App Secret de la app de Meta (developers.facebook.com > la app > Configuración > Básica > Clave secreta de la app). Es el mismo con el que Meta firma cada aviso. |
| `IG_WEBHOOK_VERIFY_TOKEN` | Un texto inventado, cualquiera, largo (por ejemplo `ogh-comentarios-2026`). Se usa una sola vez, en el paso 2, para que Meta y el sitio se reconozcan. |

Después de pegarlas hay que volver a deployar (Deployments > el último > Redeploy), porque las
variables entran al deploy y no a la función que ya está corriendo.

## 2. El alta del webhook en la app de Meta

En developers.facebook.com > la app > Webhooks (o Instagram > Configuración de la API):

1. Objeto: **Instagram**.
2. URL de devolución de llamada:

       https://www.opengatehub.com/api/ig/webhook

   Con `www`. Sin `www` el dominio redirige con un 308 y en el salto se pierden el cuerpo y la firma.
3. Token de verificación: el mismo texto que quedó en `IG_WEBHOOK_VERIFY_TOKEN`.
4. Verificar y guardar. Meta hace un GET a esa URL en el momento: si las dos claves están bien, le
   contesta el challenge y queda verificada. Si dice que no pudo validar, casi siempre es que el
   redeploy del paso 1 todavía no terminó.
5. En los campos del objeto Instagram, suscribir **comments**. Los demás no hacen falta (los
   mensajes siguen entrando por la bandeja y por el agente).

Si la app pide suscribir la cuenta además del campo, es un POST que se hace una sola vez:

```bash
curl -X POST "https://graph.facebook.com/v23.0/<ID_DE_LA_PAGINA>/subscribed_apps?subscribed_fields=comments&access_token=<TOKEN_DE_LA_PAGINA>"
```

## 3. Antes de prenderlo: ManyChat

Si la automatización de CV de ManyChat todavía está viva, los dos contestan el mismo comentario y el
lead recibe el link dos veces (pasó el 30/10 con @juliovasquez_m.a). Instagram no lo impide.

Así que primero se pausa o se borra ese flujo en ManyChat. Mientras siga vivo, el webhook se apaga
dejando `dm_config` `comentarios` en `{ "activo": true, "webhook": false }`: así contesta solo el
cron, que antes de mandar mira la bandeja.

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
