import {
  CheckCircle2,
  Circle,
  Clock,
  Globe2,
  Heart,
  MapPin,
  ShieldCheck,
  Stethoscope,
  User,
  Users,
} from "lucide-react";
import { motion } from "motion/react";

const AUDIENCES = [
  {
    id: "people-in-addiction",
    icon: Heart,
    title: "People in Active Addiction",
    description:
      "Seeking immediate access to MAT in Northeast Ohio. No account required. No data stored. Just help, right now.",
  },
  {
    id: "volunteers",
    icon: Users,
    title: "Volunteers & Peer Support Specialists",
    description:
      "Who physically escort people to treatment and need to record the handoff anonymously via the Proof of Presence QR system.",
  },
  {
    id: "clinic-staff",
    icon: Stethoscope,
    title: "Clinic Staff",
    description:
      "At participating providers — especially Brightside Recovery — who verify arrivals via QR scan and confirm the bridge was crossed.",
  },
  {
    id: "region13-admins",
    icon: ShieldCheck,
    title: "Ohio Region 13 Administrators",
    description:
      "Tracking Proof of Presence impact across ZIP codes and monitoring provider availability through the admin dashboard.",
  },
  {
    id: "prescribers",
    icon: User,
    title: "Prescribers",
    description:
      "Who want a one-click workflow to route patients to the Mark Cuban Cost Plus Drugs pharmacy (NCPDP: 5755167).",
  },
];

const FLOW_STEPS = [
  {
    id: "find-provider",
    label: "Person in crisis → Volunteer finds open provider on map",
  },
  {
    id: "gen-qr",
    label: "Volunteer generates 5-min QR token (ZIP-level, no PHI)",
  },
  { id: "walk-in", label: "Volunteer walks person into clinic" },
  { id: "scan-qr", label: "Clinic staff scans QR" },
  { id: "on-chain", label: "On-chain Proof of Presence recorded" },
  { id: "zip-counter", label: "ZIP counter increments on Admin Heatmap" },
  {
    id: "token-deleted",
    label: "Token deleted (one-time use, privacy-preserving)",
  },
];

const ROADMAP = [
  {
    id: "near-term",
    phase: "Near-Term",
    timeframe: "Next 90 Days",
    icon: Clock,
    items: [
      {
        id: "mainnet",
        text: "Live ICP canister deployment (mainnet) with stable state",
      },
      {
        id: "onboarding",
        text: "Real provider onboarding for all 17 Brightside Recovery locations",
      },
      {
        id: "heartbeat",
        text: "Heartbeat ping system — providers self-report isLive every ≤ 3 hours",
      },
      {
        id: "admin-dash",
        text: "Admin dashboard for Ohio Region 13 coordinators",
      },
    ],
  },
  {
    id: "mid-term",
    phase: "Mid-Term",
    timeframe: "3–12 Months",
    icon: MapPin,
    items: [
      {
        id: "expand-network",
        text: "Expand anchor provider network beyond Brightside (partner clinics, FQHCs)",
      },
      {
        id: "multi-region",
        text: "Multi-region support (Ohio Region 5, Region 7 — Columbus, Cincinnati corridors)",
      },
      {
        id: "sms-alerts",
        text: "SMS/push alert system for volunteers when a nearby provider goes live",
      },
      {
        id: "pwa",
        text: "Offline-capable PWA — works in low-connectivity areas",
      },
      {
        id: "mhar",
        text: "Integration with Ohio MHAR (Mental Health & Addiction Recovery) data feeds",
      },
    ],
  },
  {
    id: "long-term",
    phase: "Long-Term Vision",
    timeframe: "National Expansion",
    icon: Globe2,
    items: [
      {
        id: "statewide",
        text: "Statewide Ohio coverage with county-level PoP heatmaps",
      },
      {
        id: "national",
        text: "National expansion framework — replicable sovereign stack for other states",
      },
      {
        id: "impact-reporting",
        text: "On-chain impact reporting for funders and grant agencies",
      },
      {
        id: "open-api",
        text: "Open API for peer recovery organizations to embed Live Now data",
      },
    ],
  },
];

export default function AboutPage() {
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
              About
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
              Built by a peer.{" "}
              <span className="text-teal-light">For the community.</span>
            </h1>
            <p className="text-on-dark text-lg leading-relaxed">
              Live Now Recovery is a mission-critical infrastructure project,
              not a prototype. It is operated by someone who has been where you
              are — 8 years clean, building the tool they wish had existed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Who It Serves */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">
              Who It Serves
            </h2>
            <p className="text-muted-foreground">
              Live Now Recovery is built for five distinct groups in the
              recovery ecosystem.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {AUDIENCES.map((a, i) => {
              const Icon = a.icon;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <div className="bg-teal/10 rounded-lg p-2.5 w-fit mb-4">
                    <Icon className="h-5 w-5 text-teal" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-base mb-2">{a.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {a.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              A bridge is crossed when a volunteer guides someone from crisis to
              care. Here is the exact flow.
            </p>
          </motion.div>

          <div className="relative">
            {/* vertical line */}
            <div
              className="absolute left-5 top-0 bottom-0 w-px bg-border"
              aria-hidden="true"
            />
            <ol className="space-y-0">
              {FLOW_STEPS.map((step, i) => (
                <motion.li
                  key={step.id}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-start gap-4 relative pb-6 last:pb-0"
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10 font-bold text-sm ${
                      i === FLOW_STEPS.length - 1
                        ? "bg-teal text-white"
                        : "bg-background border-2 border-teal text-teal"
                    }`}
                  >
                    {i === FLOW_STEPS.length - 1 ? (
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  <div className="pt-2">
                    <p
                      className={`text-sm font-medium ${
                        i === FLOW_STEPS.length - 1
                          ? "text-teal font-bold"
                          : "text-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 border-l-4 border-teal bg-teal/5 rounded-r-xl px-5 py-4"
          >
            <p className="text-sm text-foreground italic">
              No patient name. No diagnosis. No identifying information. Just a
              ZIP code and a timestamp proving someone made it through the door.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">
              Where It Is Going
            </h2>
            <p className="text-muted-foreground">
              The roadmap is anchored by real-world impact, not feature
              velocity.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {ROADMAP.map((tier, i) => {
              const Icon = tier.icon;
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-teal/10 rounded-lg p-2">
                      <Icon className="h-4 w-4 text-teal" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-extrabold text-base">{tier.phase}</p>
                      <p className="text-xs text-muted-foreground">
                        {tier.timeframe}
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2.5">
                    {tier.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <Circle
                          className="h-3 w-3 mt-0.5 flex-shrink-0 text-border"
                          aria-hidden="true"
                        />
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
