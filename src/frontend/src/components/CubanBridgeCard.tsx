import { ExternalLink, TrendingDown } from "lucide-react";

export default function CubanBridgeCard() {
  return (
    <div
      className="mt-3 rounded-xl border p-3 space-y-2"
      style={{
        background: "oklch(0.62 0.17 155 / 0.06)",
        borderColor: "oklch(0.62 0.17 155 / 0.25)",
      }}
      data-ocid="cuban_bridge.card"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingDown
          className="h-3.5 w-3.5 flex-shrink-0"
          style={{ color: "oklch(0.62 0.17 155)" }}
          aria-hidden="true"
        />
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "oklch(0.62 0.17 155)" }}
        >
          Cost Plus Drug Savings
        </span>
        <a
          href="https://costplusdrugs.com"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-0.5 text-[10px] opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: "oklch(0.62 0.17 155)" }}
        >
          costplusdrugs.com
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>

      {/* Row 1 — Naloxone */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
            style={{
              background: "oklch(0.75 0.14 55 / 0.18)",
              color: "oklch(0.85 0.12 55)",
            }}
          >
            Naloxone
          </span>
          <span className="text-xs text-muted-foreground truncate">
            Generic Narcan
          </span>
        </div>
        <div className="flex-shrink-0 text-right">
          <span className="text-sm font-bold text-foreground">$61.36</span>
          <span
            className="ml-1.5 text-[10px] font-semibold"
            style={{ color: "oklch(0.62 0.17 155)" }}
          >
            save $81.64
          </span>
        </div>
      </div>

      {/* Row 2 — Naltrexone */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
            style={{
              background: "oklch(0.62 0.12 218 / 0.18)",
              color: "oklch(0.78 0.10 218)",
            }}
          >
            Naltrexone
          </span>
          <span className="text-xs text-muted-foreground truncate">
            Generic ReVia
          </span>
        </div>
        <div className="flex-shrink-0 text-right">
          <span className="text-sm font-bold text-foreground">$22.94</span>
          <span
            className="ml-1.5 text-[10px] font-semibold"
            style={{ color: "oklch(0.62 0.17 155)" }}
          >
            save $79.06
          </span>
        </div>
      </div>
    </div>
  );
}
