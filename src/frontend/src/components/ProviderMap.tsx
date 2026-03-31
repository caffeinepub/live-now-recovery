import type { ImpactData } from "@/backend.d";
import type { ProviderWithCoords } from "@/constants/providers";
import { isProviderStale } from "@/utils/emergency";
import { ZIP_COORDS } from "@/utils/zipCoords";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

// Leaflet is loaded via CDN to keep it outside the npm bundle.
// We declare the minimal types we need here.
declare global {
  interface Window {
    L: LeafletStatic;
  }
}
interface LeafletMap {
  remove(): void;
  setView(center: [number, number], zoom: number): LeafletMap;
}
type LeafletIcon = Record<string, unknown>;
interface LeafletMarker {
  addTo(map: LeafletMap): LeafletMarker;
  bindPopup(html: string): LeafletMarker;
  on(event: string, handler: () => void): LeafletMarker;
}
interface LeafletCircle {
  addTo(map: LeafletMap): LeafletCircle;
  bindPopup(html: string): LeafletCircle;
}
interface LeafletLayer {
  addTo(map: LeafletMap): LeafletLayer;
}
interface LeafletStatic {
  map(el: HTMLElement, options?: Record<string, unknown>): LeafletMap;
  tileLayer(url: string, options?: Record<string, unknown>): LeafletLayer;
  divIcon(options: Record<string, unknown>): LeafletIcon;
  marker(
    latlng: [number, number],
    options?: Record<string, unknown>,
  ): LeafletMarker;
  circle(
    latlng: [number, number],
    options?: Record<string, unknown>,
  ): LeafletCircle;
}

interface ProviderMapProps {
  providers: ProviderWithCoords[];
  activeHelperZips?: string[];
  impactData?: ImpactData[];
  systemRiskLevel?: string;
}

const CLEVELAND_CENTER: [number, number] = [41.4993, -81.6944];
const CDN_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const CDN_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function ensureLeafletCSS() {
  if (document.querySelector(`link[href="${CDN_CSS}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = CDN_CSS;
  document.head.appendChild(link);
}

function loadLeafletJS(): Promise<void> {
  if (window.L) return Promise.resolve();
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

function pinHtml(color: string) {
  return `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.45);"></div>`;
}

export default function ProviderMap({
  providers,
  activeHelperZips,
  impactData,
  systemRiskLevel,
}: ProviderMapProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [showImpact, setShowImpact] = useState(false);

  useEffect(() => {
    ensureLeafletCSS();
    let cancelled = false;

    loadLeafletJS()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const L = window.L;

        // Destroy previous instance if any
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const map = L.map(containerRef.current, { scrollWheelZoom: false });
        map.setView(CLEVELAND_CENTER, 10);
        mapRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        // Render helper ZIP coverage circles
        if (activeHelperZips) {
          for (const zip of activeHelperZips) {
            const coords = ZIP_COORDS[zip];
            if (!coords) continue;
            L.circle([coords.lat, coords.lng], {
              radius: 800,
              fillColor: "#2ECC71",
              fillOpacity: 0.15,
              color: "#2ECC71",
              weight: 2,
              opacity: 0.4,
            }).addTo(map);
          }
        }

        // Impact shadow layer
        if (showImpact && impactData && impactData.length > 0) {
          for (const d of impactData) {
            const coords = ZIP_COORDS[d.zip];
            if (!coords) continue;
            const intents = Number(d.searchIntents);
            const radius = Math.max(400, intents * 80);
            const isRush = systemRiskLevel === "RED" || intents > 20;

            const circle = L.circle([coords.lat, coords.lng], {
              radius,
              fillColor: "#27AE60",
              fillOpacity: 0.25,
              color: "#27AE60",
              weight: 1.5,
              opacity: 0.5,
              className: isRush ? "shadow-pulse-rush" : "shadow-pulse-calm",
            }).addTo(map);

            const savings = Number(d.savingsPot).toFixed(2);
            const lives = Number(d.livesProjected).toFixed(1);
            const helpers = Number(d.helperCount);

            circle.bindPopup(
              `<div style="background:#1A1C1E;color:#F4F4F4;padding:12px 14px;border-radius:10px;font-size:13px;min-width:200px;border:1px solid #27AE60;"><p style="font-weight:700;font-size:14px;margin:0 0 8px;color:#27AE60;">${d.zip} Community Impact</p><p style="margin:4px 0;color:#F2994A;">&#128176; Community Wealth Reclaimed: $${savings}</p><p style="margin:4px 0;color:#27AE60;">&#128737; Safety Coverage: ${lives} Lives Protected</p><p style="margin:4px 0;color:#2D9CDB;">&#129309; Active Peer Bridge: ${helpers} Helper${helpers !== 1 ? "s" : ""} Live</p></div>`,
            );
          }
        }

        for (const provider of providers) {
          let color = "#9CA3AF"; // grey = offline
          if (provider.isVerified && provider.isLive) {
            color = isProviderStale(provider.lastVerified)
              ? "#FBBF24" // yellow = stale
              : "#2ECC71"; // green = live
          }

          const icon = L.divIcon({
            className: "",
            html: pinHtml(color),
            iconSize: [18, 18],
            iconAnchor: [9, 9],
            popupAnchor: [0, -12],
          });

          const popup = `<div style="font-size:13px;"><p style="font-weight:700;margin:0 0 2px;">${provider.name}</p><p style="color:#555;margin:0 0 2px;">${provider.address}</p><p style="color:#008080;font-weight:600;margin:0 0 4px;">${provider.phone}</p><p style="font-size:11px;font-weight:500;margin:0;color:${provider.isLive && provider.isVerified ? "#16a34a" : "#9ca3af"}">${provider.isLive && provider.isVerified ? "\u25cf LIVE NOW" : "\u25cf Offline"}</p></div>`;

          const providerId = provider.id;
          L.marker([provider.lat, provider.lng], { icon })
            .addTo(map)
            .bindPopup(popup)
            .on("click", () => {
              navigate({
                to: "/provider/$id",
                params: { id: providerId },
              });
            });
        }
      })
      .catch(() => {
        // Map fails to load gracefully — container stays empty
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [
    providers,
    activeHelperZips,
    navigate,
    showImpact,
    impactData,
    systemRiskLevel,
  ]);

  return (
    <div
      className="h-full w-full rounded-xl overflow-hidden relative"
      style={{ minHeight: "320px" }}
    >
      <div ref={containerRef} className="h-full w-full" />
      <button
        type="button"
        data-ocid="map.toggle"
        onClick={() => setShowImpact((v) => !v)}
        className={`absolute top-3 right-3 z-[1000] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          showImpact
            ? "bg-[#27AE60] text-white shadow-lg"
            : "bg-[#1A1C1E]/80 text-[#27AE60] border border-[#27AE60]/40"
        }`}
      >
        {showImpact ? "● Hide Impact" : "◎ Show Impact"}
      </button>
    </div>
  );
}
