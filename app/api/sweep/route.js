import { put } from "@vercel/blob";
import { XMLParser } from "fast-xml-parser";
import people from "../../../data/people.json";
import { getAlerts } from "../../../lib/alerts.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
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

async function fetchPerson(person) {
  const res = await fetch(gnewsUrl(person.feed || `"${person.name}"`), {
    headers: { "user-agent": "Mozilla/5.0 (DGRIS Tracker sweep)" },
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
      url: String(it.link || ""),
      pub,
    };
  });
}

async function runSweep() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const store = await getAlerts({ fresh: true });
  const existing = Array.isArray(store.alerts) ? store.alerts : [];
  const seenUrls = new Set(existing.map((a) => a.url));

  const batches = await Promise.all(
    people.map((p) => fetchPerson(p).catch(() => []))
  );

  const fresh = [];
  for (const item of batches.flat()) {
    if (!item.url || !item.title) continue;
    if (!item.pub || item.pub < cutoff) continue;
    if (seenUrls.has(item.url)) continue;
    seenUrls.add(item.url);
    fresh.push({
      id: `${item.personId}-${isoDate(item.pub)}-${shortHash(item.url)}`,
      date: isoDate(item.pub),
      approx: false,
      personId: item.personId,
      person: item.person,
      title: item.title,
      source: item.source,
      url: item.url,
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
  });

  return { added: fresh.length, total: merged.alerts.length, lastSweep: merged.lastSweep };
}

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request) {
  if (!authorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const result = await runSweep();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
