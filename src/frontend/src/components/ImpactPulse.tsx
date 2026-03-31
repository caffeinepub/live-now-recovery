import { useActor } from "@/hooks/useActor";
import { getZipCoords } from "@/utils/zipCoords";
import { Activity } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const CDN_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const CDN_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const CLEVELAND: [number, number] = [41.4993, -81.6944];

function ensureLeafletCSS() {
  if (document.querySelector(`link[href="${CDN_CSS}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = CDN_CSS;
  document.head.appendChild(link);
}

function loadLeafletJS(): Promise<void> {
  if ((window as any).L) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${CDN_JS}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = CDN_JS;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function ImpactPulse() {
  const { actor } = useActor();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const isInitialRef = useRef(true);
  const [stats, setStats] = useState({ total: BigInt(0), recent: BigInt(0) });

  // ── Initialize Leaflet map ───────────────────────────────────────────
  useEffect(() => {
    ensureLeafletCSS();
    let cancelled = false;

    loadLeafletJS()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const L = (window as any).L;

        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const map = L.map(containerRef.current, {
          scrollWheelZoom: false,
          zoomControl: true,
        });
        map.setView(CLEVELAND, 11);
        mapRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // ── Poll handoff stats ───────────────────────────────────────────────
  useEffect(() => {
    if (!actor) return;
    let cancelled = false;

    const fetchStats = async () => {
      try {
        const s = await (actor as any).getHandoffStats();
        if (!cancelled && s) {
          setStats({
            total: s.total ?? BigInt(0),
            recent: s.recent ?? BigInt(0),
          });
        }
      } catch {
        // ignore — backend may not have handoff methods yet
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [actor]);

  // ── Poll recent handoffs → trigger pulses ────────────────────────────
  useEffect(() => {
    if (!actor) return;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const since = BigInt(Date.now() - 30 * 60 * 1000) * 1_000_000n;
        const handoffs: any[] = await (actor as any).getRecentHandoffs(since);
        if (cancelled) return;

        const newCompleted = handoffs.filter(
          (h: any) =>
            h.status && "Completed" in h.status && !seenIds.current.has(h.id),
        );

        for (const h of newCompleted) {
          seenIds.current.add(h.id);
          // Don't pulse on initial load — only on NEW events
          if (!isInitialRef.current) {
            triggerPulse(h.zip);
          }
        }

        isInitialRef.current = false;
      } catch {
        // ignore
      }
    };

    poll();
    const interval = setInterval(poll, 5_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [actor]);

  function triggerPulse(zip: string) {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    const coords = getZipCoords(zip);
    const icon = L.divIcon({
      className: "",
      html: `<div class="impact-pulse-dot"></div>`,
      iconSize: [64, 64],
      iconAnchor: [32, 32],
    });

    const marker = L.marker([coords.lat, coords.lng], { icon }).addTo(
      mapRef.current,
    );

    // Auto-remove after animation completes
    setTimeout(() => {
      try {
        marker.remove();
      } catch {
        /* marker already removed */
      }
    }, 3_500);
  }

  return (
    <div data-ocid="admin.impact_pulse.section">
      {/* Pulse animation CSS */}
      <style>{`
        @keyframes impactPulse {
          0%   { transform: scale(0.4); opacity: 0.9; }
          60%  { opacity: 0.35; }
          100% { transform: scale(3.2); opacity: 0; }
        }
        .impact-pulse-dot {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(0, 128, 128, 0.22);
          border: 2.5px solid rgba(0, 128, 128, 0.85);
          box-shadow: 0 0 12px rgba(0, 128, 128, 0.5);
          animation: impactPulse 2.8s cubic-bezier(0.4, 0, 0.6, 1) forwards;
        }
      `}</style>

      {/* ── Stats panel ────────────────────────────────────────────── */}
      <div className="mb-5 rounded-xl border border-border bg-card shadow-card p-5">
        <h3 className="flex items-center gap-2 font-bold text-lg mb-4 text-foreground">
          <Activity className="h-5 w-5 text-teal" aria-hidden="true" />
          Total Lives Bridged
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-xl border border-teal/25 bg-teal/5 p-5 text-center"
            data-ocid="admin.impact_pulse.total.card"
          >
            <p className="text-4xl font-extrabold text-teal tabular-nums leading-none">
              {stats.total.toString()}
            </p>
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              All Time
            </p>
          </div>
          <div
            className="rounded-xl border border-teal/25 bg-teal/5 p-5 text-center"
            data-ocid="admin.impact_pulse.recent.card"
          >
            <p className="text-4xl font-extrabold text-teal tabular-nums leading-none">
              {stats.recent.toString()}
            </p>
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              Last 24h
            </p>
          </div>
        </div>
      </div>

      {/* ── Live map ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border overflow-hidden shadow-card">
        <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center gap-2.5">
          <span
            className="h-2.5 w-2.5 rounded-full bg-teal animate-pulse-slow"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold text-foreground">
            Impact Pulse — Live Handoff Map
          </p>
          <p className="text-xs text-muted-foreground ml-auto hidden sm:block">
            Teal ripple = verified bridge event
          </p>
        </div>
        <div
          ref={containerRef}
          style={{ height: "360px", width: "100%" }}
          data-ocid="admin.impact_pulse.canvas_target"
        />
      </div>
    </div>
  );
}
