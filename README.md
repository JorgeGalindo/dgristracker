# DGRIS Tracker

Seguimiento de **Antoni "Toni" Plasència Taradach** —Director General de Recerca i
Innovació en Salut (DGRIS) del Departament de Salut de la Generalitat de Catalunya—
y de su entorno institucional.

- **`/`** — Informe de perfil (renderizado desde `plasencia.md`).
- **`/rio`** — Río de alertas: presencia en medios de las personas citadas en el
  informe, alimentado por un barrido semanal. Ver [`AUTOMATION.md`](./AUTOMATION.md).

Stack: Next.js (App Router) · Roboto Mono · estética dark · deploy en Vercel
(`dgristracker.vercel.app`).

## Desarrollo

```bash
npm install
npm run dev
```

## Datos

- `plasencia.md` — informe fuente.
- `data/people.json` — personas monitorizadas.
- `data/alerts.json` — alertas del río (`lastSweep` + `alerts[]`).
