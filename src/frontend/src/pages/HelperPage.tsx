import type { Helper } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  useCheckOutArea,
  useClaimArea,
  useHelperStatus,
  useHighRiskAreas,
  useLiveHelpers,
  useRequestHandoff,
  useSendVerificationSMS,
} from "@/hooks/useQueries";
import { isAdminRole, isHelperRole, useRole } from "@/hooks/useRole";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  LogIn,
  MapPin,
  QrCode,
  RefreshCw,
  Shield,
  Smartphone,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

function useCountdown(targetMs: number | null) {
  const [remaining, setRemaining] = useState<number>(0);
  useEffect(() => {
    if (targetMs === null) return;
    const update = () => setRemaining(Math.max(0, targetMs - Date.now()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  return remaining;
}

function formatCountdown(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m remaining`;
  if (m > 0) return `${m}m ${sec}s remaining`;
  return `${sec}s remaining`;
}

function isHelperActive(helper: Helper | null | undefined): boolean {
  if (!helper) return false;
  if (!("Active" in helper.status)) return false;
  const lastCheckInMs = Number(helper.lastCheckIn) / 1_000_000;
  return Date.now() - lastCheckInMs < FOUR_HOURS_MS;
}

/** Formats raw digits to XXX-XXX-XXXX as user types */
function formatPhone(digits: string): string {
  const d = digits.slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Converts masked XXX-XXX-XXXX to E.164 +1XXXXXXXXXX */
function toE164(masked: string): string {
  const digits = masked.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

// ── Go Live Section ─────────────────────────────────────────────────────────

function GoLiveSection() {
  const [zip, setZip] = useState("");
  const [coverZip, setCoverZip] = useState<string | null>(null);
  const { data: helperStatus, refetch: refetchStatus } = useHelperStatus();
  const { data: liveCount } = useLiveHelpers(helperStatus?.assignedZip ?? zip);
  const claimMutation = useClaimArea();
  const checkOutMutation = useCheckOutArea();

  const active = isHelperActive(helperStatus);
  const lastCheckInMs = helperStatus
    ? Number(helperStatus.lastCheckIn) / 1_000_000
    : null;
  const expiryTarget = lastCheckInMs ? lastCheckInMs + FOUR_HOURS_MS : null;
  const countdown = useCountdown(active ? expiryTarget : null);

  useEffect(() => {
    function handler(e: Event) {
      const z = (e as CustomEvent<string>).detail;
      setZip(z);
      setCoverZip(z);
    }
    window.addEventListener("helper:coverZip", handler);
    return () => window.removeEventListener("helper:coverZip", handler);
  }, []);

  async function handleGoLive(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{5}$/.test(zip)) {
      toast.error("Please enter a valid 5-digit ZIP code.");
      return;
    }
    try {
      await claimMutation.mutateAsync(zip);
      await refetchStatus();
      toast.success(`You are now LIVE in ZIP ${zip}!`);
      setCoverZip(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to go live.");
    }
  }

  async function handleCheckOut() {
    try {
      await checkOutMutation.mutateAsync();
      await refetchStatus();
      toast.success("You have checked out. Thanks for showing up.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to check out.");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-0 shadow-xl overflow-hidden">
        <div
          className="px-6 py-5 flex items-center gap-4"
          style={{ background: "var(--color-teal)" }}
        >
          <div className="bg-white/20 rounded-full p-3">
            <MapPin className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-white font-extrabold text-xl tracking-tight">
              Go Live in My ZIP
            </h2>
            <p className="text-white/80 text-sm">
              Claim your area - let the community know you are here
            </p>
          </div>
        </div>
        <CardContent className="p-6">
          {active && helperStatus ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                <span className="h-3 w-3 rounded-full bg-live animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-green-800 text-lg">
                    You are LIVE in ZIP {helperStatus.assignedZip}
                  </p>
                  <p className="text-green-600 text-sm">
                    {formatCountdown(countdown)}
                  </p>
                </div>
              </div>

              {liveCount !== undefined && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  <span>
                    <span className="font-bold text-foreground">
                      {Number(liveCount)}
                    </span>{" "}
                    {Number(liveCount) === 1 ? "Helper" : "Helpers"} active in{" "}
                    {helperStatus.assignedZip}
                  </span>
                </div>
              )}

              <Button
                onClick={handleCheckOut}
                disabled={checkOutMutation.isPending}
                variant="outline"
                className="w-full h-14 text-base font-bold border-destructive text-destructive hover:bg-destructive hover:text-white"
                data-ocid="helper.checkout.button"
              >
                {checkOutMutation.isPending ? (
                  <Loader2
                    className="h-5 w-5 animate-spin mr-2"
                    aria-hidden="true"
                  />
                ) : null}
                Check Out
              </Button>
            </div>
          ) : (
            <form onSubmit={handleGoLive} className="space-y-4">
              {coverZip && (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 text-sm">
                  <AlertTriangle
                    className="h-4 w-4 text-orange-500 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-orange-800 font-medium">
                    High-Risk area - {coverZip} needs coverage
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCoverZip(null);
                      setZip("");
                    }}
                    className="ml-auto text-orange-400 hover:text-orange-600"
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div>
                <Label
                  htmlFor="golive-zip"
                  className="text-sm font-semibold mb-1.5 block"
                >
                  Your ZIP Code
                </Label>
                <Input
                  id="golive-zip"
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="44102"
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                  className="h-14 text-xl font-bold text-center tracking-widest border-2"
                  data-ocid="helper.golive.input"
                />
              </div>

              {zip.length === 5 && liveCount !== undefined && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  <span>
                    <span className="font-bold text-foreground">
                      {Number(liveCount)}
                    </span>{" "}
                    {Number(liveCount) === 1 ? "Helper" : "Helpers"} currently
                    active in {zip}
                  </span>
                </div>
              )}

              <Button
                type="submit"
                disabled={claimMutation.isPending || zip.length < 5}
                className="w-full h-16 text-lg font-extrabold text-white border-0 shadow-lg tracking-wide"
                style={{ background: "var(--color-teal)" }}
                data-ocid="helper.golive.button"
              >
                {claimMutation.isPending ? (
                  <Loader2
                    className="h-6 w-6 animate-spin mr-2"
                    aria-hidden="true"
                  />
                ) : (
                  <MapPin className="h-6 w-6 mr-2" aria-hidden="true" />
                )}
                {claimMutation.isPending ? "Going Live..." : "GO LIVE"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Handoff QR Section ──────────────────────────────────────────────────────

function HandoffQRSection() {
  const [open, setOpen] = useState(false);
  const [zip, setZip] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  const requestHandoff = useRequestHandoff();

  const expiryTarget = generatedAt ? generatedAt + FIVE_MINUTES_MS : null;
  const countdown = useCountdown(open && token ? expiryTarget : null);
  const expired = countdown === 0 && token !== null && generatedAt !== null;

  const verifyUrl = token
    ? `${window.location.origin}/verify?token=${token}`
    : "";

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{5}$/.test(zip)) {
      toast.error("Please enter a valid 5-digit ZIP code.");
      return;
    }
    try {
      const t = await requestHandoff.mutateAsync(zip);
      setToken(t);
      setGeneratedAt(Date.now());
      toast.success("QR code generated! You have 5 minutes.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate QR.",
      );
    }
  }

  function handleRegen() {
    setToken(null);
    setGeneratedAt(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="border-0 shadow-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full text-left"
          data-ocid="helper.qr.toggle"
          aria-expanded={open}
        >
          <div
            className="px-6 py-5 flex items-center gap-4"
            style={{ background: "var(--color-navy)" }}
          >
            <div className="bg-white/20 rounded-full p-3">
              <QrCode className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-extrabold text-xl tracking-tight">
                Generate Handoff QR
              </h2>
              <p className="text-white/80 text-sm">
                Create a verified handoff token for clinic check-in
              </p>
            </div>
            {open ? (
              <ChevronUp
                className="h-5 w-5 text-white/60 flex-shrink-0"
                aria-hidden="true"
              />
            ) : (
              <ChevronDown
                className="h-5 w-5 text-white/60 flex-shrink-0"
                aria-hidden="true"
              />
            )}
          </div>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              key="qr-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: "hidden" }}
            >
              <CardContent className="p-6">
                {!token ? (
                  <form onSubmit={handleGenerate} className="space-y-4">
                    <div>
                      <Label
                        htmlFor="qr-zip"
                        className="text-sm font-semibold mb-1.5 block"
                      >
                        Destination ZIP Code
                      </Label>
                      <Input
                        id="qr-zip"
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        placeholder="44102"
                        value={zip}
                        onChange={(e) =>
                          setZip(e.target.value.replace(/\D/g, ""))
                        }
                        className="h-14 text-xl font-bold text-center tracking-widest border-2"
                        data-ocid="helper.qr.input"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={requestHandoff.isPending || zip.length < 5}
                      className="w-full h-16 text-lg font-extrabold text-white border-0 shadow-lg"
                      style={{ background: "var(--color-navy)" }}
                      data-ocid="helper.qr.generate.button"
                    >
                      {requestHandoff.isPending ? (
                        <Loader2
                          className="h-6 w-6 animate-spin mr-2"
                          aria-hidden="true"
                        />
                      ) : (
                        <QrCode className="h-6 w-6 mr-2" aria-hidden="true" />
                      )}
                      {requestHandoff.isPending
                        ? "Generating..."
                        : "Generate QR Code"}
                    </Button>
                  </form>
                ) : expired ? (
                  <div className="text-center space-y-4 py-2">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="font-bold text-red-700 text-lg">
                        Token expired
                      </p>
                      <p className="text-red-500 text-sm">
                        This QR code is no longer valid.
                      </p>
                    </div>
                    <Button
                      onClick={handleRegen}
                      className="w-full h-14 text-base font-bold text-white"
                      style={{ background: "var(--color-navy)" }}
                      data-ocid="helper.qr.regenerate.button"
                    >
                      <RefreshCw className="h-5 w-5 mr-2" aria-hidden="true" />
                      Generate New Token
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-white p-4 rounded-xl shadow border">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(verifyUrl)}&bgcolor=ffffff&color=0d3349&margin=2`}
                        alt="Handoff verification QR code"
                        width={220}
                        height={220}
                        className="rounded"
                      />
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="h-2 w-2 rounded-full bg-live animate-pulse" />
                        <span className="font-bold text-green-700 text-lg">
                          {Math.floor(countdown / 60000)}:
                          {String(
                            Math.floor((countdown % 60000) / 1000),
                          ).padStart(2, "0")}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          remaining
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        ZIP: {zip}
                      </p>
                    </div>
                    <Button
                      onClick={handleRegen}
                      variant="outline"
                      className="text-sm"
                      data-ocid="helper.qr.reset.button"
                    >
                      <X className="h-4 w-4 mr-1" aria-hidden="true" />
                      Cancel / New QR
                    </Button>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ── High-Risk Areas Section ─────────────────────────────────────────────────

function HighRiskSection() {
  const [open, setOpen] = useState(false);
  const { data: riskZips = [], isLoading } = useHighRiskAreas();

  function handleCoverZip(zip: string) {
    window.dispatchEvent(new CustomEvent("helper:coverZip", { detail: zip }));
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info(`ZIP ${zip} pre-filled in Go Live - scroll up to confirm.`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="border-0 shadow-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full text-left"
          data-ocid="helper.highrisk.toggle"
          aria-expanded={open}
        >
          <div
            className="px-6 py-5 flex items-center gap-4"
            style={{ background: "var(--color-emergency)" }}
          >
            <div className="bg-white/20 rounded-full p-3">
              <AlertTriangle
                className="h-7 w-7 text-white"
                aria-hidden="true"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-white font-extrabold text-xl tracking-tight">
                  View High-Risk Areas
                </h2>
                {riskZips.length > 0 && (
                  <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {riskZips.length}
                  </span>
                )}
              </div>
              <p className="text-white/80 text-sm">
                ZIP codes with high demand but zero helpers
              </p>
            </div>
            {open ? (
              <ChevronUp
                className="h-5 w-5 text-white/60 flex-shrink-0"
                aria-hidden="true"
              />
            ) : (
              <ChevronDown
                className="h-5 w-5 text-white/60 flex-shrink-0"
                aria-hidden="true"
              />
            )}
          </div>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              key="highrisk-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: "hidden" }}
            >
              <CardContent className="p-6">
                {isLoading ? (
                  <div
                    className="flex justify-center py-8"
                    data-ocid="helper.highrisk.loading_state"
                  >
                    <Loader2
                      className="h-7 w-7 animate-spin text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                ) : riskZips.length === 0 ? (
                  <div
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="helper.highrisk.empty_state"
                  >
                    <Shield
                      className="h-10 w-10 mx-auto mb-3 text-green-500"
                      aria-hidden="true"
                    />
                    <p className="font-semibold text-foreground">All clear</p>
                    <p className="text-sm">
                      No high-risk ZIP codes detected right now.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3" data-ocid="helper.highrisk.list">
                    {riskZips.map((zip, i) => (
                      <div
                        key={zip}
                        className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                        data-ocid={`helper.highrisk.item.${i + 1}`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="font-black text-xl"
                            style={{ color: "var(--color-emergency)" }}
                          >
                            {zip}
                          </span>
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{
                              background: "rgba(192,57,43,0.1)",
                              color: "var(--color-emergency)",
                            }}
                          >
                            No helpers active
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCoverZip(zip)}
                          className="text-white font-bold text-sm"
                          style={{ background: "var(--color-emergency)" }}
                          data-ocid={`helper.highrisk.cover.button.${i + 1}`}
                        >
                          Cover This ZIP
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ── Notification Settings Section ───────────────────────────────────────────

function NotificationSettings() {
  const { data: helperStatus } = useHelperStatus();
  const sendSms = useSendVerificationSMS();

  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [smsState, setSmsState] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");

  const assignedZip =
    helperStatus && "Active" in helperStatus.status
      ? helperStatus.assignedZip
      : "00000";

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneDisplay(formatPhone(raw));
    setSmsState("idle");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const digits = phoneDisplay.replace(/\D/g, "");
    if (digits.length !== 10) {
      setSmsState("error");
      setErrorMsg("Please enter a valid 10-digit US phone number.");
      return;
    }
    setSmsState("idle");
    setErrorMsg("");
    try {
      const outcome = await sendSms.mutateAsync({
        targetPhone: toE164(phoneDisplay),
        callerZip: assignedZip,
      });
      if (outcome === "success") {
        setSmsState("success");
      } else {
        setSmsState("error");
        setErrorMsg(
          outcome === "not_configured"
            ? "SMS is not configured yet. Ask an admin to set up Twilio."
            : `Send failed: ${outcome}`,
        );
      }
    } catch (err) {
      setSmsState("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Unexpected error. Try again.",
      );
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      data-ocid="helper.notifications.panel"
    >
      <Card className="border-0 shadow-xl overflow-hidden">
        <div
          className="px-6 py-5 flex items-center gap-4"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.28 0.04 222) 0%, oklch(0.32 0.06 196) 100%)",
          }}
        >
          <div className="bg-white/20 rounded-full p-3">
            <Bell className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-white font-extrabold text-xl tracking-tight">
              Notification Settings
            </h2>
            <p className="text-white/80 text-sm">
              Verify your device to receive Rush Alerts
            </p>
          </div>
        </div>

        <CardContent className="p-6">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Label
                htmlFor="helper-phone"
                className="text-sm font-semibold mb-1.5 flex items-center gap-1.5"
              >
                <Smartphone className="h-4 w-4" aria-hidden="true" />
                Mobile Number
              </Label>
              <Input
                id="helper-phone"
                type="tel"
                inputMode="numeric"
                placeholder="216-555-1212"
                value={phoneDisplay}
                onChange={handlePhoneChange}
                className="h-14 text-xl font-bold text-center tracking-widest border-2"
                aria-label="Mobile number for verification"
                data-ocid="helper.notifications.input"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Your number is never stored — only used to send the one-time
                verification.
              </p>
            </div>

            <Button
              type="submit"
              disabled={
                sendSms.isPending ||
                phoneDisplay.replace(/\D/g, "").length !== 10
              }
              className="w-full h-16 text-lg font-extrabold text-white border-0 shadow-lg"
              style={{ background: "var(--color-teal)" }}
              data-ocid="helper.notifications.button"
            >
              {sendSms.isPending ? (
                <Loader2
                  className="h-6 w-6 animate-spin mr-2"
                  aria-hidden="true"
                />
              ) : (
                <Smartphone className="h-6 w-6 mr-2" aria-hidden="true" />
              )}
              {sendSms.isPending ? "Sending..." : "Verify My Device"}
            </Button>
          </form>

          <AnimatePresence>
            {smsState === "success" && (
              <motion.div
                key="sms-success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-4 flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-4"
                data-ocid="helper.notifications.success_state"
              >
                <CheckCircle2
                  className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-bold text-green-800 text-sm">
                    Device verified!
                  </p>
                  <p className="text-green-700 text-sm">
                    Check your phone. You're now synced to the Recovery Bridge.
                  </p>
                </div>
              </motion.div>
            )}

            {smsState === "error" && (
              <motion.div
                key="sms-error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-4"
                data-ocid="helper.notifications.error_state"
              >
                <XCircle
                  className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-bold text-red-700 text-sm">
                    Verification failed
                  </p>
                  <p className="text-red-600 text-sm">{errorMsg}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function HelperPage() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { role, isLoading: isRoleLoading } = useRole();
  const navigate = useNavigate();

  // Role-based gating: only Helper and Admin can access this page
  if (isAuthenticated && !isRoleLoading && role !== undefined) {
    if (role !== null && !isHelperRole(role) && !isAdminRole(role)) {
      return (
        <div
          className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4"
          data-ocid="helper.access.error_state"
        >
          <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <Users className="h-8 w-8 text-teal" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-extrabold mb-2">
            Community Helpers Only
          </h1>
          <p className="text-muted-foreground mb-6 max-w-xs">
            This area is for registered Community Helpers only.
          </p>
          <Button
            size="lg"
            onClick={() => navigate({ to: "/register" })}
            className="bg-teal hover:bg-teal-dark text-white font-bold border-0 min-h-[52px]"
            data-ocid="helper.register.button"
          >
            Register as Helper
          </Button>
        </div>
      );
    }
  }

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center px-4"
        data-ocid="helper.page"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div
            className="rounded-full p-4 w-20 h-20 flex items-center justify-center mx-auto mb-6"
            style={{ background: "oklch(0.36 0.065 196)" }}
          >
            <Users className="h-10 w-10 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-extrabold mb-2">Community Helper</h1>
          <p className="text-muted-foreground mb-2 text-base">
            Be the bridge between crisis and care.
          </p>
          <p className="text-muted-foreground text-sm mb-8">
            Sign in anonymously to go live in your ZIP, generate handoff QR
            codes, and see where you are needed most.
          </p>
          <Button
            size="lg"
            onClick={login}
            disabled={isLoggingIn}
            className="h-14 px-8 text-white font-bold text-base w-full border-0 shadow-lg"
            style={{ background: "var(--color-teal)" }}
            data-ocid="helper.login.button"
          >
            {isLoggingIn ? (
              <Loader2
                className="h-5 w-5 animate-spin mr-2"
                aria-hidden="true"
              />
            ) : (
              <LogIn className="h-5 w-5 mr-2" aria-hidden="true" />
            )}
            {isLoggingIn ? "Connecting..." : "Sign In Anonymously"}
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            No name. No data. Just your anonymous presence.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div data-ocid="helper.page">
      <section
        className="text-white py-10 px-4"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.22 0.038 225) 0%, oklch(0.28 0.04 222) 50%, oklch(0.36 0.065 196) 100%)",
        }}
      >
        <div className="max-w-xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-4"
          >
            <span className="h-2 w-2 rounded-full bg-live animate-pulse" />
            Community Helper Dashboard
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2"
          >
            You Are the Bridge
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-white/70 text-sm"
          >
            Anonymous. Verified. Present.
          </motion.p>
        </div>
      </section>

      <section
        className="py-8 px-4"
        style={{ background: "oklch(0.97 0.005 220)" }}
      >
        <div className="max-w-xl mx-auto space-y-5">
          <GoLiveSection />
          <HandoffQRSection />
          <HighRiskSection />
          <NotificationSettings />
        </div>
      </section>
    </div>
  );
}
