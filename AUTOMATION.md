# Barrido semanal — río de alertas

El río (`/rio`) se alimenta de `data/alerts.json`. Cada semana se ejecuta un
barrido de presencia en medios de las personas listadas en `data/people.json`.

## Procedimiento (lo ejecuta un agente programado de Claude Code)

1. Para cada persona en `data/people.json`, buscar en la web su `query` filtrando
   por noticias de los **últimos 7 días** (medios, notas de prensa institucionales,
   actos, entrevistas).
2. Por cada resultado relevante y **nuevo** (no presente ya en `alerts.json` — dedup
   por `url`), construir un objeto de alerta:

   ```json
   {
     "id": "<slug-unico>",
     "date": "YYYY-MM-DD",
     "approx": false,
     "personId": "<id de people.json>",
     "person": "<nombre>",
     "title": "<titular>",
     "source": "<medio o institución>",
     "url": "<url>",
     "summary": "<2-3 frases neutras>"
   }
   ```

3. Añadir las nuevas alertas al array `alerts`, actualizar `lastSweep` a la fecha
   del barrido, y `git commit && git push`. Vercel redesplegará automáticamente.

## Criterio

- Priorizar a `plasencia` (sujeto principal, `primary: true`) y al núcleo del
  Departament de Salut.
- Marcar `approx: true` cuando solo se conozca el mes, no el día exacto.
- Resúmenes neutros, sin valoración. Es un tracker, no un editorial.
