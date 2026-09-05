# Dominio y DNS — opengatehub.com

## Dónde vive cada cosa
- **Registrador + DNS:** GoDaddy (cuenta `hubopengate@gmail.com`, nameservers `ns29/ns30.domaincontrol.com`)
- **Hosting del sitio:** Vercel (`www` → CNAME `cname.vercel-dns.com`; apex `@` → A `216.198.79.1`)
- **Subdominios `strategy` y `kickoff`:** registros A → `15.197.225.128` / `3.33.251.168` (redirecciones a los calendarios de Google)

## Redirecciones del sitio (next.config.js)
- `/devs` → formulario Notion de la red de devs
- `/discoverycall` → calendario de Google "Discovery Call" (`calendar.app.google/JnGP5JWka16VhZEP7`)

## Incidente 2026-09: el apex dejó de funcionar
`opengatehub.com` (sin www) apuntaba a la IP vieja de Vercel `76.76.21.21`, que Vercel dio de baja.
El sitio con `www` seguía andando porque usa CNAME. **Fix:** registro A de `@` actualizado a `216.198.79.1` (2026-09-04).
Si Vercel vuelve a cambiar de IP, el valor vigente aparece en Vercel → proyecto → Settings → Domains.

## API de GoDaddy (para automatizar DNS)
- Token personal **"claude-dns-opengatehub"** (scope Domains & DNS), expira **2027-09-04**.
- El valor está SOLO en `.secrets/godaddy-api.env` (gitignoreado). Jamás commitearlo.
- Regenerar: https://developer.godaddy.com/keys logueada con la cuenta de GoDaddy.
- Uso:
  ```bash
  source .secrets/godaddy-api.env
  curl -H "Authorization: Bearer $GODADDY_API_TOKEN" \
    https://api.godaddy.com/v1/domains/opengatehub.com/records/A/@
  ```
