import { isEmergencyMode } from "@/utils/emergency";
import { AlertTriangle, Phone } from "lucide-react";

export default function EmergencyBanner() {
  const emergency = isEmergencyMode();
  if (!emergency) return null;

  return (
    <div
      className="w-full bg-emergency text-white py-3 px-4 flex items-center justify-center gap-3 text-sm font-semibold z-50"
      role="alert"
      aria-live="polite"
      data-ocid="emergency.panel"
    >
      <AlertTriangle
        className="h-4 w-4 flex-shrink-0 animate-pulse-slow"
        aria-hidden="true"
      />
      <span className="text-center">
        AFTER HOURS — For immediate 24/7 help, call Ohio MAR NOW:{" "}
        <a
          href="tel:8332346343"
          className="underline font-bold hover:opacity-80 transition-opacity"
          data-ocid="emergency.link"
        >
          833-234-6343
        </a>
        &nbsp;— We&apos;re here for you NOW.
      </span>
      <Phone className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
    </div>
  );
}
