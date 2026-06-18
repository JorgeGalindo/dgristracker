import fs from "node:fs";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ReportPage() {
  const md = fs.readFileSync(
    path.join(process.cwd(), "plasencia.md"),
    "utf-8"
  );

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
