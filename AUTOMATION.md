# Barrido semanal — río de alertas

El río (`/rio`) se alimenta de un **Vercel Cron** que corre dentro del propio
proyecto, sin LLM y sin servicios externos. Datos crudos vía RSS.

## Mecanismo

- **Cron:** definido en `vercel.json` → `GET /api/sweep`, cada **lunes 07:00 UTC**
  (09:00 Europe/Madrid). Vercel añade automáticamente la cabecera
  `Authorization: Bearer $CRON_SECRET`; la route rechaza cualquier petición sin él.
- **Fuente:** Google News RSS por persona (`data/people.json`, campo `feed`):
  `https://news.google.com/rss/search?q=<feed>&hl=es&gl=ES&ceid=ES:es`. Gratis, sin API key.
- **Filtro:** solo ítems con `pubDate` de los últimos 7 días.
- **Dedup:** por `url` exacta contra el estado actual.
- **Almacenamiento:** un único blob público `alerts.json` en **Vercel Blob**
  (store `dgristracker-alerts`). La route hace merge y reescribe el blob.
- **Lectura:** `/rio` (`lib/alerts.js`) hace fetch del blob público con
  revalidación; si el blob aún no existe, cae al seed empaquetado en
  `data/alerts.json`.

## Forma de cada alerta

```json
{
  "id": "<personId>-<YYYY-MM-DD>-<hash>",
  "date": "YYYY-MM-DD",
  "approx": false,
  "personId": "<id de people.json>",
  "person": "<nombre>",
  "title": "<titular>",
  "source": "<medio>",
  "url": "<url>",
  "summary": ""
}
```

## Disparo manual

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://dgristracker.vercel.app/api/sweep
```

## Variables de entorno (Vercel)

- `BLOB_READ_WRITE_TOKEN` — escritura en el Blob store (auto al vincular el store).
- `CRON_SECRET` — protege la route del cron.
