"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-brand">
          <span className="dot" />
          DGRIS&nbsp;TRACKER
        </Link>
        <div className="nav-links">
          <Link href="/" className={`nav-link${path === "/" ? " active" : ""}`}>
            Río de alertas
          </Link>
          <Link
            href="/informe"
            className={`nav-link${path === "/informe" ? " active" : ""}`}
          >
            Informe
          </Link>
        </div>
      </div>
    </nav>
  );
}
