import type { ProviderWithCoords } from "@/constants/providers";
import { isProviderStale } from "@/utils/emergency";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

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
}

interface ProviderMapProps {
  providers: ProviderWithCoords[];
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

export default function ProviderMap({ providers }: ProviderMapProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

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

          const popup = `
            <div style="font-size:13px;">
              <p style="font-weight:700;margin:0 0 2px;">${provider.name}</p>
              <p style="color:#555;margin:0 0 2px;">${provider.address}</p>
              <p style="color:#008080;font-weight:600;margin:0 0 4px;">${provider.phone}</p>
              <p style="font-size:11px;font-weight:500;margin:0;color:${
                provider.isLive && provider.isVerified ? "#16a34a" : "#9ca3af"
              }">
                ${provider.isLive && provider.isVerified ? "\u25cf LIVE NOW" : "\u25cf Offline"}
              </p>
            </div>`;

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
  }, [providers, navigate]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-xl overflow-hidden"
      style={{ minHeight: "320px" }}
    />
  );
}
