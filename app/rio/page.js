"use client";

import { useMemo, useState } from "react";
import alertsData from "../../data/alerts.json";
import people from "../../data/people.json";

const peopleById = Object.fromEntries(people.map((p) => [p.id, p]));

function formatDate(iso, approx) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  if (approx) return `${months[m - 1]} ${y}`;
  return `${String(d).padStart(2, "0")} ${months[m - 1]} ${y}`;
}

export default function RioPage() {
  const [filter, setFilter] = useState("all");

  const alerts = useMemo(
    () =>
      [...alertsData.alerts].sort((a, b) => b.date.localeCompare(a.date)),
    []
  );

  const activePeople = useMemo(() => {
    const ids = new Set(alerts.map((a) => a.personId));
    return people.filter((p) => ids.has(p.id));
  }, [alerts]);

  const shown =
    filter === "all"
      ? alerts
      : alerts.filter((a) => a.personId === filter);

  return (
    <div>
      <div className="page-head">
        <h1>Río de alertas</h1>
        <p>
          Presencia en medios de Antoni Plasència y su entorno institucional.
          Último barrido: {formatDate(alertsData.lastSweep, false)} ·{" "}
          {alerts.length} señales.
        </p>
      </div>

      <div className="filters">
        <button
          className={`chip${filter === "all" ? " active" : ""}`}
          onClick={() => setFilter("all")}
        >
          Todos
        </button>
        {activePeople.map((p) => (
          <button
            key={p.id}
            className={`chip${filter === p.id ? " active" : ""}`}
            onClick={() => setFilter(p.id)}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="river">
        {shown.length === 0 && (
          <div className="empty">Sin señales para este filtro.</div>
        )}
        {shown.map((a) => {
          const person = peopleById[a.personId];
          return (
            <div
              key={a.id}
              className={`alert${person?.primary ? " primary" : ""}`}
            >
              <div className="alert-date">
                {formatDate(a.date, a.approx)}
                {a.approx ? " · aprox." : ""}
              </div>
              <div className="alert-card">
                <div className="alert-person">
                  {a.person}
                  {person?.role && (
                    <span className="role">· {person.role}</span>
                  )}
                </div>
                <h3 className="alert-title">{a.title}</h3>
                <p className="alert-summary">{a.summary}</p>
                <div className="alert-foot">
                  <span className="alert-source">{a.source}</span>
                  <a
                    className="alert-link"
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    fuente ↗
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
