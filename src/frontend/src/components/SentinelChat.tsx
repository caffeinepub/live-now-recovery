import { ArrowLeft, MessageCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

type Prompt = {
  id: string;
  label: string;
  response: string[];
};

const PROMPTS: Prompt[] = [
  {
    id: "find-clinic",
    label: "Find a clinic near me",
    response: [
      "Head to the map above and search your ZIP code — every green pin is a verified provider available RIGHT NOW.",
      "If nothing is showing, tap the Ohio MAR NOW hotline: 833-234-6343. Available 24/7. Someone will pick up.",
    ],
  },
  {
    id: "cost-plus",
    label: "Explain Cost Plus savings",
    response: [
      "Suboxone (buprenorphine/naloxone) costs $185/month at most pharmacies.",
      "Mark Cuban's Cost Plus Drugs sells the same generic for $45.37/month — that's $139 back in your pocket every single month.",
      "Every provider card on this site has a one-tap 'Transfer Script' button to switch right now. NCPDP: 5755167.",
    ],
  },
  {
    id: "naloxone",
    label: "How do I use a Naloxone box?",
    response: [
      "1. Call 911 first.",
      "2. Lay the person on their back.",
      "3. Insert the Narcan nasal spray nozzle into one nostril and press the plunger firmly.",
      "4. If no response in 2–3 minutes, give a second dose in the other nostril.",
      "5. Do rescue breathing if trained.",
      "6. Stay until help arrives.",
      "You can do this. You are not alone.",
    ],
  },
];

export default function SentinelChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-[320px] max-h-[480px] rounded-2xl shadow-2xl border border-border bg-card flex flex-col overflow-hidden"
            data-ocid="sentinel_chat.panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-trust-blue/10">
              <div>
                <p className="font-bold text-sm text-foreground">
                  Sentinel Helper
                </p>
                <p className="text-xs text-muted-foreground leading-snug max-w-[220px]">
                  I'm your Peer Assistant. Ask me about local clinics, Cost Plus
                  savings, or 24/7 help in Ohio.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setActivePrompt(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md ml-2 flex-shrink-0"
                aria-label="Close chat"
                data-ocid="sentinel_chat.close_button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                {!activePrompt ? (
                  <motion.div
                    key="prompts"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-3"
                  >
                    <p className="text-xs text-muted-foreground mb-4">
                      What can I help you with?
                    </p>
                    {PROMPTS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setActivePrompt(p)}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: "oklch(0.75 0.14 55 / 0.12)",
                          border: "1px solid oklch(0.75 0.14 55 / 0.3)",
                          color: "oklch(0.88 0.10 55)",
                        }}
                        data-ocid="sentinel_chat.prompt.button"
                      >
                        {p.label}
                      </button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="response"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-3"
                  >
                    <button
                      type="button"
                      onClick={() => setActivePrompt(null)}
                      className="flex items-center gap-1 text-xs text-trust-blue hover:opacity-80 transition-opacity mb-2"
                      data-ocid="sentinel_chat.back.button"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Ask another question
                    </button>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      {activePrompt.label}
                    </p>
                    {activePrompt.response.map((line) => (
                      <p
                        key={line}
                        className="text-sm text-foreground leading-relaxed"
                      >
                        {line}
                      </p>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-border bg-muted/30">
              <p className="text-[10px] text-muted-foreground text-center">
                Built by a peer 8-years clean. Never stores your data.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (isOpen) setActivePrompt(null);
        }}
        whileTap={{ scale: 0.94 }}
        className="flex items-center gap-2 px-4 py-3 rounded-full text-white font-semibold text-sm shadow-lg transition-colors"
        style={{ background: "oklch(0.62 0.12 218)" }}
        aria-label="Open Sentinel Helper chat"
        data-ocid="sentinel_chat.open_modal_button"
      >
        {isOpen ? (
          <X className="h-4 w-4" />
        ) : (
          <MessageCircle className="h-4 w-4" />
        )}
        {!isOpen && "Get Help"}
      </motion.button>
    </div>
  );
}
