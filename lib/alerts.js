import bundled from "../data/alerts.json";

// URL pública estable del Blob store (acceso público, sin token de lectura).
export const ALERTS_URL =
  "https://hhwh3ejxjmktk36e.public.blob.vercel-storage.com/alerts.json";

// Lee el estado del río desde Blob; si aún no existe, usa el seed empaquetado.
export async function getAlerts({ fresh = false } = {}) {
  try {
    const res = await fetch(ALERTS_URL, {
      cache: fresh ? "no-store" : undefined,
      next: fresh ? undefined : { revalidate: 600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.alerts)) return data;
    }
  } catch (_) {
    // sin red o blob vacío → fallback
  }
  return bundled;
}
