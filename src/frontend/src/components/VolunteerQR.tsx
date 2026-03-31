import type { Provider } from "@/backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRequestHandoff } from "@/hooks/useQueries";
import { QrCode, RefreshCw, Shield } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface VolunteerQRProps {
  provider: Pick<Provider, "zip" | "name">;
}

const FIVE_MIN_SECS = 5 * 60;

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function VolunteerQR({ provider }: VolunteerQRProps) {
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(FIVE_MIN_SECS);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const requestHandoff = useRequestHandoff();

  // Countdown interval — runs when token is active
  useEffect(() => {
    if (!token || !expiresAt || isExpired) return;

    intervalRef.current = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((expiresAt - Date.now()) / 1000),
      );
      setSecondsLeft(remaining);
      if (remaining === 0) {
        setIsExpired(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [token, expiresAt, isExpired]);

  async function handleGenerate() {
    // Reset state before generating
    setToken(null);
    setIsExpired(false);
    setSecondsLeft(FIVE_MIN_SECS);
    if (intervalRef.current) clearInterval(intervalRef.current);

    try {
      const newToken = await requestHandoff.mutateAsync(provider.zip);
      const expiry = Date.now() + FIVE_MIN_SECS * 1000;
      setToken(newToken);
      setExpiresAt(expiry);
    } catch {
      toast.error("Failed to generate handoff QR. Please try again.");
    }
  }

  const qrUrl = token
    ? `${window.location.origin}/verify?token=${encodeURIComponent(token)}`
    : null;

  const progressPct = (secondsLeft / FIVE_MIN_SECS) * 100;

  return (
    <Card
      className="border-2 border-teal/40 shadow-glow"
      data-ocid="volunteer.qr.card"
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <QrCode className="h-5 w-5 text-teal" aria-hidden="true" />
          Proof of Presence — Handoff QR
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate a 5-minute secure token for a clinic to scan and verify your
          bridge.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {!token ? (
          /* Pre-generation state */
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-52 h-52 border-2 border-dashed border-teal/30 rounded-xl flex items-center justify-center bg-muted/50">
              <QrCode className="h-20 w-20 text-teal/20" aria-hidden="true" />
            </div>
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={requestHandoff.isPending}
              className="bg-teal hover:bg-teal-button text-white font-bold px-8 py-4 min-h-[52px] w-full"
              data-ocid="volunteer.qr.primary_button"
            >
              {requestHandoff.isPending ? (
                <>
                  <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <QrCode className="h-5 w-5 mr-2" aria-hidden="true" />
                  Generate Handoff QR
                </>
              )}
            </Button>
          </div>
        ) : (
          /* QR active state */
          <div className="flex flex-col items-center gap-4">
            {/* QR code with expiry overlay */}
            <div className="relative">
              <div className="bg-white p-4 rounded-xl shadow-card border border-border">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl!)}&bgcolor=ffffff&color=0d3349&margin=2`}
                  alt="Handoff verification QR code — scan to complete bridge"
                  width={200}
                  height={200}
                  className="block"
                  data-ocid="volunteer.qr.canvas_target"
                />
              </div>

              {/* Expiry overlay */}
              <AnimatePresence>
                {isExpired && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-3 p-4"
                    style={{ background: "rgba(10,22,40,0.88)" }}
                    data-ocid="volunteer.qr.expired.modal"
                  >
                    <p className="text-white font-bold text-center">
                      Token Expired
                    </p>
                    <p className="text-white/60 text-xs text-center">
                      Generate a new QR to continue
                    </p>
                    <Button
                      size="sm"
                      onClick={handleGenerate}
                      disabled={requestHandoff.isPending}
                      className="bg-teal hover:bg-teal-button text-white font-semibold mt-1"
                      data-ocid="volunteer.qr.regenerate.primary_button"
                    >
                      <RefreshCw
                        className="h-4 w-4 mr-1.5"
                        aria-hidden="true"
                      />
                      Regenerate
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Countdown bar + timer (decorative — timer text is the accessible label) */}
            {!isExpired && (
              <div className="w-full space-y-2">
                <div
                  className="w-full bg-muted rounded-full h-2.5 overflow-hidden"
                  aria-hidden="true"
                >
                  <div
                    className="h-2.5 rounded-full bg-teal transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p
                  className="text-center font-mono text-3xl font-bold tracking-widest text-foreground"
                  aria-live="off"
                >
                  {formatTime(secondsLeft)}
                  <span className="text-sm font-sans font-normal text-muted-foreground ml-2">
                    remaining
                  </span>
                </p>
              </div>
            )}

            {/* Regenerate without expiry */}
            {!isExpired && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={requestHandoff.isPending}
                className="w-full border-teal/30 text-teal hover:bg-teal/5"
                data-ocid="volunteer.qr.secondary_button"
              >
                <RefreshCw className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Generate New Token
              </Button>
            )}
          </div>
        )}

        {/* Security note */}
        <div className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2.5">
          <Shield
            className="h-4 w-4 text-teal flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            QR contains only an anonymous token. No identity data is transmitted
            or stored. Compliant with No-PHI policy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
