import { put } from "@vercel/blob";
import { XMLParser } from "fast-xml-parser";
import people from "../../../data/people.json";
import { getAlerts } from "../../../lib/alerts.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UA = "Mozilla/5.0 (compatible; DGRIS-Tracker/1.0)";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

function gnewsUrl(query) {
  const q = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${q}&hl=es&gl=ES&ceid=ES:es`;
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function shortHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36).slice(0, 6);
}

// "Titular - Medio" → { title, source }
function splitTitle(raw, fallbackSource) {
  const idx = raw.lastIndexOf(" - ");
  if (idx > 0) {
    return { title: raw.slice(0, idx).trim(), source: raw.slice(idx + 3).trim() };
  }
  return { title: raw.trim(), source: fallbackSource || "" };
}

// Resuelve el enlace redirect de Google News (/rss/articles/CBMi...) a la URL
// canónica del medio, vía el endpoint batchexecute. Si falla, devuelve el original.
async function resolveUrl(link) {
  try {
    const m = link.match(/\/rss\/articles\/([^?]+)/);
    if (!m) return link;
    const art = m[1];
    const page = await fetch(`https://news.google.com/rss/articles/${art}`, {
      headers: { "user-agent": UA },
      cache: "no-store",
    }).then((r) => r.text());
    const sig = page.match(/data-n-a-sg="([^"]+)"/)?.[1];
    const ts = page.match(/data-n-a-ts="([^"]+)"/)?.[1];
    if (!sig || !ts) return link;
    const optsInner = ["X", "X", ["X", "X"], null, null, 1, 1, "US:en", null, 1, null, null, null, null, null, 0, 1];
    const second = [optsInner, "X", "X", 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0];
    const innerReq = JSON.stringify(["garturlreq", second, art, Number(ts), sig]);
    const freq = JSON.stringify([[["Fbv4je", innerReq, null, "generic"]]]);
    const body = new URLSearchParams({ "f.req": freq }).toString();
    const resp = await fetch(
      "https://news.google.com/_/DotsSplashUi/data/batchexecute",
      {
        method: "POST",
        headers: {
          "user-agent": UA,
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body,
        cache: "no-store",
      }
    ).then((r) => r.text());
    const rm = resp.match(/\[\\"garturlres\\",\\"(.*?)\\"/);
    if (rm) {
      return rm[1]
        .replace(/\\u003d/gi, "=")
        .replace(/\\u0026/gi, "&")
        .replace(/\\\//g, "/");
    }
    return link;
  } catch {
    return link;
  }
}

async function fetchPerson(person) {
  const res = await fetch(gnewsUrl(person.feed || `"${person.name}"`), {
    headers: { "user-agent": UA },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const xml = await res.text();
  const doc = parser.parse(xml);
  let items = doc?.rss?.channel?.item || [];
  if (!Array.isArray(items)) items = [items];
  return items.map((it) => {
    const fallbackSource =
      typeof it.source === "object" ? it.source["#text"] : it.source;
    const { title, source } = splitTitle(String(it.title || ""), fallbackSource);
    const pub = it.pubDate ? new Date(it.pubDate) : null;
    return {
      personId: person.id,
      person: person.name,
      title,
      source: source || "Google News",
      glink: String(it.link || ""),
      pub,
    };
  });
}

async function runSweep() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const store = await getAlerts({ fresh: true });
  const existing = Array.isArray(store.alerts) ? store.alerts : [];
  const existingUrls = new Set(existing.map((a) => a.url));

  const batches = await Promise.all(
    people.map((p) => fetchPerson(p).catch(() => []))
  );

  // Candidatos: últimos 7 días, con titular y enlace.
  const candidates = batches
    .flat()
    .filter((it) => it.glink && it.title && it.pub && it.pub >= cutoff);

  // Resuelve URLs canónicas en paralelo.
  const resolved = await Promise.all(
    candidates.map(async (it) => ({ ...it, url: await resolveUrl(it.glink) }))
  );

  const fresh = [];
  const batchUrls = new Set();
  for (const it of resolved) {
    if (existingUrls.has(it.url) || batchUrls.has(it.url)) continue;
    batchUrls.add(it.url);
    fresh.push({
      id: `${it.personId}-${isoDate(it.pub)}-${shortHash(it.url)}`,
      date: isoDate(it.pub),
      approx: false,
      personId: it.personId,
      person: it.person,
      title: it.title,
      source: it.source,
      url: it.url,
      summary: "",
    });
  }

  const merged = {
    lastSweep: isoDate(now),
    alerts: [...fresh, ...existing].sort((a, b) => b.date.localeCompare(a.date)),
  };

  await put("alerts.json", JSON.stringify(merged, null, 2), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });

  return { added: fresh.length, total: merged.alerts.length, lastSweep: merged.lastSweep };
}

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  try {
    const result = await runSweep();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
