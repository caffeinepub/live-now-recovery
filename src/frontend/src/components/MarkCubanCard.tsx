import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink, Pill } from "lucide-react";

export default function MarkCubanCard() {
  return (
    <div
      className="rounded-xl p-5 text-white"
      style={{ background: "oklch(0.36 0.065 196)" }}
      data-ocid="cuban.card"
    >
      <div className="flex items-center gap-2 mb-3">
        <Pill className="h-5 w-5 text-teal-light" aria-hidden="true" />
        <h3 className="font-bold text-base">Transparent Medication Pricing</h3>
      </div>

      <p className="text-on-dark text-sm mb-4 leading-relaxed">
        Buprenorphine-Naloxone (monthly supply)
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div
          className="rounded-lg p-3"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <p className="text-xs text-on-dark mb-1 uppercase tracking-wide">
            Traditional Retail
          </p>
          <p className="text-2xl font-bold text-white line-through opacity-70">
            $185
          </p>
          <p className="text-xs text-on-dark">/month</p>
        </div>
        <div
          className="rounded-lg p-3 border"
          style={{
            background: "rgba(46,204,113,0.15)",
            borderColor: "rgba(46,204,113,0.35)",
          }}
        >
          <p className="text-xs text-green-300 mb-1 uppercase tracking-wide font-semibold">
            Cost Plus Pricing
          </p>
          <p className="text-2xl font-bold text-green-300">$45.37</p>
          <p className="text-xs text-on-dark">/month</p>
        </div>
      </div>

      <p className="text-xs text-on-dark mb-4">
        NCPDP ID:{" "}
        <span className="font-mono font-semibold text-white">5755167</span>
      </p>

      <Button
        asChild
        className="w-full font-bold bg-live hover:bg-green-400 text-navy border-0"
        data-ocid="cuban.transfer_script.button"
      >
        <a
          href="https://costplusdrugs.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2"
        >
          Transfer Your Script
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </Button>
    </div>
  );
}
