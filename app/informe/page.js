import fs from "node:fs";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Elimina secciones de nivel ## cuyo título empiece por alguno de `titles`.
function stripSections(md, titles) {
  const lines = md.split("\n");
  const out = [];
  let skipping = false;
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      skipping = titles.some((t) =>
        h2[1].toLowerCase().startsWith(t.toLowerCase())
      );
    }
    if (!skipping) out.push(line);
  }
  return out.join("\n").trimEnd() + "\n";
}

export default function ReportPage() {
  const raw = fs.readFileSync(
    path.join(process.cwd(), "plasencia.md"),
    "utf-8"
  );
  const md = stripSections(raw, ["Recommendations", "Caveats"]);

  return (
    <article className="report">
      <div className="report-meta">
        <span className="tag">INFORME DE PERFIL</span>
        <span className="tag">DGRIS · Departament de Salut</span>
        <span className="tag">Generalitat de Catalunya</span>
      </div>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
    </article>
  );
}
