import { AlertTriangle, Eye, Lock, QrCode } from "lucide-react";
import { motion } from "motion/react";

const PROBLEMS = [
  {
    id: "stale-status",
    problem: 'Clinics list as "open" but are actually full or closed',
    solution: "4-Hour Decay Law — stale status automatically marked Unknown",
  },
  {
    id: "no-map",
    problem: "People in crisis don't know which clinic to go to",
    solution:
      "Live map with confirmed green pins only for verified-fresh providers",
  },
  {
    id: "no-proof",
    problem: "Volunteers drop people off without proof it happened",
    solution:
      "Proof of Presence QR handoff — on-chain record, anonymous, one-time",
  },
  {
    id: "cost-barrier",
    problem: "Suboxone costs $185/month at retail — patients disappear",
    solution:
      "Mandatory Cost Plus price card — $45.37/month with one-click script transfer",
  },
  {
    id: "after-hours",
    problem: "Treatment deserts invisible at night and on weekends",
    solution:
      "Deep red emergency banner after 5 PM ET and on weekends with MAR NOW hotline",
  },
  {
    id: "privacy-fear",
    problem: "Patients afraid their data will be shared",
    solution:
      "Zero PHI — fully anonymous Internet Identity, no names, no records",
  },
];

const HARD_RULES = [
  {
    id: "no-phi",
    icon: Lock,
    number: "01",
    title: "No-PHI Policy",
    body: "Absolute prohibition on storing Patient Health Information. No patient names, dates of birth, diagnoses, prescriptions, or any data that could identify an individual. This rule cannot be suspended, toggled, or overridden.",
  },
  {
    id: "decay-law",
    icon: AlertTriangle,
    number: "02",
    title: "The 4-Hour Decay Law",
    body: "Any provider isLive status older than 4 hours is automatically treated as Unknown — never as true. Enforced server-side on every heartbeat. No UI component may show a green Live pin without a server-confirmed fresh timestamp.",
  },
  {
    id: "transparency",
    icon: Eye,
    number: "03",
    title: "Transparency Mandate",
    body: "Every provider view must include the Price Comparison Card — no exceptions. MAT Retail $185.00 vs. Mark Cuban Cost Plus Drugs $45.37. The mandate exists to fight price opacity in addiction treatment.",
  },
  {
    id: "pop-metric",
    icon: QrCode,
    number: "04",
    title: "Proof of Presence as Primary Metric",
    body: "Tokens expire in exactly 5 minutes. One-time use only — deleted on successful verification. Each verified handoff increments the ZIP-level counter. PoP is how we measure whether this system is actually working.",
  },
];

export default function MissionPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero */}
      <section className="bg-navy text-white py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-teal-light text-sm font-bold tracking-widest uppercase mb-4">
              Our Mission
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-8">
              Close the gap between{" "}
              <span className="text-teal-light">crisis</span> and{" "}
              <span className="text-teal-light">care</span>.
            </h1>
            <div className="space-y-4 text-lg text-on-dark leading-relaxed">
              <p>
                Every day in Ohio, people in active addiction call clinics — and
                get voicemail. They show up at treatment centers — and find
                locked doors. They ask for help — and get a waiting list.
              </p>
              <p className="text-white font-semibold">
                Live Now Recovery exists to close that gap in real time.
              </p>
              <p>
                We surface which providers are actually available right now, get
                people through the door with a verified warm handoff, and
                eliminate the hidden cost barrier that keeps Suboxone out of
                reach — all without storing a single byte of patient data.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why We Built This */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">
              Why We Built This
            </h2>
            <p className="text-muted-foreground mb-8">
              The opioid crisis in Northeast Ohio is not a shortage of treatment
              — it is a shortage of real-time information and trusted handoffs.
            </p>
          </motion.div>

          <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="text-left px-5 py-3 font-bold text-foreground w-1/2">
                    The Problem
                  </th>
                  <th className="text-left px-5 py-3 font-bold text-teal w-1/2">
                    Our Solution
                  </th>
                </tr>
              </thead>
              <tbody>
                {PROBLEMS.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className={`border-b border-border last:border-0 ${
                      i % 2 === 0 ? "bg-background" : "bg-muted/40"
                    }`}
                  >
                    <td className="px-5 py-4 text-muted-foreground align-top">
                      {row.problem}
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground align-top">
                      {row.solution}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Hard Rules — The Covenant */}
      <section className="bg-navy py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <p className="text-teal-light text-sm font-bold tracking-widest uppercase mb-2">
              Non-Negotiable
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              The Hard Rules
            </h2>
            <p className="text-on-dark mt-2">
              These rules exist at the architecture level. They cannot be
              removed, toggled, or overridden by any user, admin, or future
              build.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-5">
            {HARD_RULES.map((rule, i) => {
              const Icon = rule.icon;
              return (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white/5 border-l-4 border-teal rounded-r-xl p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-teal/20 rounded-lg p-2.5 flex-shrink-0">
                      <Icon
                        className="h-5 w-5 text-teal-light"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <p className="text-teal-light text-xs font-bold tracking-widest uppercase mb-1">
                        Rule {rule.number}
                      </p>
                      <h3 className="text-white font-bold text-lg mb-2">
                        {rule.title}
                      </h3>
                      <p className="text-on-dark text-sm leading-relaxed">
                        {rule.body}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
