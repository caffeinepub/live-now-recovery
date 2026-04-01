import { Heart, Quote } from "lucide-react";
import { motion } from "motion/react";

export default function FounderPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.75 0.14 55 / 0.12) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest"
              style={{
                borderColor: "oklch(0.75 0.14 55 / 0.4)",
                color: "oklch(0.82 0.12 55)",
                background: "oklch(0.75 0.14 55 / 0.08)",
              }}
            >
              <Heart className="h-3 w-3 fill-current" aria-hidden="true" />
              10 Years in the Program
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-5">
              Built from{" "}
              <span style={{ color: "oklch(0.82 0.12 55)" }}>the Inside</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              One man&apos;s decade in medically assisted treatment. One mission
              to close the gap that almost cost him everything.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-8"
          data-ocid="founder.story.section"
        >
          {/* Pull quote */}
          <div
            className="relative pl-8 border-l-4"
            style={{ borderColor: "oklch(0.75 0.14 55 / 0.5)" }}
          >
            <Quote
              className="absolute -left-3 -top-1 h-6 w-6"
              style={{ color: "oklch(0.82 0.12 55)" }}
              aria-hidden="true"
            />
            <p
              className="text-xl sm:text-2xl font-medium leading-relaxed"
              style={{ color: "oklch(0.90 0.06 55)" }}
            >
              &ldquo;The gap between needing help and finding it is not a minor
              inconvenience. It costs lives.&rdquo;
            </p>
          </div>

          {/* Dom's story */}
          <div className="space-y-5 text-base sm:text-lg leading-relaxed text-foreground/90">
            <p>
              I&apos;m Dom. I&apos;m 46 years old and I&apos;ve been in
              medically assisted treatment for close to a decade. When I first
              walked through the door at Brightside &mdash; when they had just
              one location &mdash; I had no app, no map, no way to know who was
              open, who was accepting patients, or whether help was even
              available nearby. I had to figure it out alone.
            </p>
            <p>
              That gap between needing help and finding it is not a minor
              inconvenience. It costs lives. I built Live Now Recovery because I
              lived that gap. Because I know what it feels like to be standing
              at the edge and not knowing where to go. This platform is the tool
              I wish I had.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Mission */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
        >
          <div
            className="rounded-2xl p-6 sm:p-8 border"
            style={{
              background: "oklch(0.22 0.02 196 / 0.7)",
              borderColor: "oklch(0.62 0.12 218 / 0.25)",
            }}
            data-ocid="founder.mission.card"
          >
            <h2
              className="text-xl sm:text-2xl font-bold mb-4"
              style={{ color: "oklch(0.78 0.10 218)" }}
            >
              The Mission
            </h2>
            <div className="space-y-4 text-foreground/85 leading-relaxed">
              <p>
                Live Now Recovery provides real-time, anonymous access to
                Medication-Assisted Treatment providers across Northeast Ohio.
                No accounts required. No data stored. No judgment.
              </p>
              <p>
                We are privacy-first because the people who need us most are
                often the most afraid to be seen. We are community-powered
                because peer connection &mdash; not clinical bureaucracy &mdash;
                is what actually bridges the gap in a crisis moment.
              </p>
              <p>
                Every verified provider on our map. Every Community Helper who
                goes live. Every Proof of Presence handoff recorded. These are
                not metrics. They are moments where a life changed direction.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Personal message */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div
            className="rounded-2xl p-6 sm:p-8 relative overflow-hidden"
            style={{
              background: "oklch(0.28 0.06 55 / 0.8)",
              border: "1px solid oklch(0.75 0.14 55 / 0.35)",
            }}
            data-ocid="founder.message.card"
          >
            <span
              className="absolute top-4 right-6 text-8xl font-serif leading-none select-none pointer-events-none"
              style={{ color: "oklch(0.75 0.14 55 / 0.12)" }}
              aria-hidden="true"
            >
              &ldquo;
            </span>

            <h2
              className="text-xl sm:text-2xl font-bold mb-5"
              style={{ color: "oklch(0.88 0.12 55)" }}
            >
              A Message from Dom
            </h2>

            <div
              className="space-y-4 text-base sm:text-lg leading-relaxed"
              style={{ color: "oklch(0.92 0.05 55)" }}
            >
              <p>
                If you&apos;re reading this, you already took the first step.
                Don&apos;t stop.
              </p>
              <p>
                No hurdle is going to stop this. No wall is going to stop this.
                I have been exactly where you are, and I promise you &mdash;
                people are out here who care, who want to help, who are building
                for you.
              </p>
              <p>
                It was not giving up that brought me to this moment. It was
                refusing to. Every day in the program is a day you are choosing
                yourself. Every time you ask for help, you are stronger, not
                weaker.
              </p>
              <p>
                This application exists because of where I have been, and
                because of where I believe we can go &mdash; together. No
                potential opportunity, no matter how big, is worth more than the
                person reading this right now.
              </p>
              <p>
                You are not alone. Recovery is real. Help is real. And we are
                coming.
              </p>
            </div>

            <div
              className="mt-6 pt-5"
              style={{ borderTop: "1px solid oklch(0.75 0.14 55 / 0.25)" }}
            >
              <p
                className="font-bold text-lg"
                style={{ color: "oklch(0.88 0.12 55)" }}
              >
                &mdash; Dom, Founder
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: "oklch(0.80 0.08 55)" }}
              >
                Live Now Recovery LLC &middot; 10 years in the program
              </p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
