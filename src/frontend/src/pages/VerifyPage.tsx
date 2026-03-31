import { useActor } from "@/hooks/useActor";
import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type VerifyState = "loading" | "success" | "error";

export default function VerifyPage() {
  const { actor, isFetching } = useActor();
  const [state, setState] = useState<VerifyState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const hasCalledRef = useRef(false);

  useEffect(() => {
    if (isFetching) return;

    if (!actor) {
      setState("error");
      setErrorMsg("Unable to connect to the network. Please try again.");
      return;
    }

    if (hasCalledRef.current) return;
    hasCalledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setState("error");
      setErrorMsg("No verification token found in this URL.");
      return;
    }

    (actor as any)
      .completeHandoff(token)
      .then((result: { ok: null } | { err: string }) => {
        if ("ok" in result) {
          setState("success");
        } else if ("err" in result) {
          if ((result as { err: string }).err === "already_completed") {
            setState("success");
          } else if ((result as { err: string }).err === "expired") {
            setState("error");
            setErrorMsg(
              "This QR code has expired. Ask the volunteer to generate a new one.",
            );
          } else {
            setState("error");
            setErrorMsg("Invalid QR code. Please try again.");
          }
        } else {
          setState("error");
          setErrorMsg("Unexpected response from the network.");
        }
      })
      .catch(() => {
        setState("error");
        setErrorMsg(
          "Network error while verifying. Please check your connection.",
        );
      });
  }, [actor, isFetching]);

  return (
    <>
      <style>{`
        @keyframes verifyRipple {
          0%   { transform: translate(-50%, -50%) scale(0.7); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
        }
        .verify-ripple-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.55);
          width: 130px;
          height: 130px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: verifyRipple 2.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .verify-ripple-ring-2 { animation-delay: 0.55s; }
        .verify-ripple-ring-3 { animation-delay: 1.1s; }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-6"
        style={{ background: "#0a1628" }}
        data-ocid="verify.page"
      >
        {/* ── Loading ─────────────────────────────────── */}
        {state === "loading" && (
          <div
            className="flex flex-col items-center gap-5 text-center"
            data-ocid="verify.loading_state"
          >
            <div
              className="h-14 w-14 rounded-full animate-spin"
              style={{
                border: "4px solid rgba(0,128,128,0.25)",
                borderTopColor: "#008080",
              }}
              aria-hidden="true"
            />
            <p className="text-white text-xl font-semibold tracking-wide">
              Verifying Bridge...
            </p>
            <p className="text-white/40 text-sm">
              Connecting to Internet Computer
            </p>
          </div>
        )}

        {/* ── Success ─────────────────────────────────── */}
        {state === "success" && (
          <div
            className="flex flex-col items-center gap-7 text-center max-w-xs w-full"
            data-ocid="verify.success_state"
          >
            {/* Ripple animation */}
            <div
              className="relative flex items-center justify-center"
              style={{ width: "190px", height: "190px" }}
            >
              <span className="verify-ripple-ring" aria-hidden="true" />
              <span
                className="verify-ripple-ring verify-ripple-ring-2"
                aria-hidden="true"
              />
              <span
                className="verify-ripple-ring verify-ripple-ring-3"
                aria-hidden="true"
              />
              {/* Center badge */}
              <div
                className="relative z-10 rounded-full flex items-center justify-center"
                style={{
                  width: "110px",
                  height: "110px",
                  background:
                    "linear-gradient(135deg, #008080 0%, #006666 100%)",
                  boxShadow: "0 0 40px rgba(0,128,128,0.6)",
                }}
              >
                <CheckCircle2
                  className="h-16 w-16 text-white"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div>
              <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
                Bridge Confirmed
              </h1>
              <p className="text-white/65 text-sm leading-relaxed">
                This handoff has been recorded anonymously on the Internet
                Computer. No personal data was stored.
              </p>
            </div>

            <div
              className="flex items-center gap-2.5 rounded-xl px-4 py-3 w-full"
              style={{
                background: "rgba(0,128,128,0.15)",
                border: "1px solid rgba(0,128,128,0.35)",
              }}
            >
              <span className="text-teal text-base" aria-hidden="true">
                🔒
              </span>
              <p className="text-white/60 text-xs leading-relaxed text-left">
                Proof of Presence · No PHI transmitted · Sovereign Stack
              </p>
            </div>
          </div>
        )}

        {/* ── Error ───────────────────────────────────── */}
        {state === "error" && (
          <div
            className="flex flex-col items-center gap-6 text-center max-w-xs w-full"
            data-ocid="verify.error_state"
          >
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: "110px",
                height: "110px",
                background: "rgba(220,38,38,0.15)",
                border: "2px solid rgba(220,38,38,0.5)",
              }}
            >
              <XCircle
                className="h-16 w-16"
                style={{ color: "#f87171" }}
                aria-hidden="true"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Verification Failed
              </h1>
              <p className="text-white/60 text-sm leading-relaxed">
                {errorMsg || "Unable to verify this handoff."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.close()}
              className="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
              data-ocid="verify.close.button"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </>
  );
}
