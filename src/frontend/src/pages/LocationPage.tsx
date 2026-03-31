import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowRight, Heart, MapPin } from "lucide-react";
import { useEffect } from "react";

function formatTownName(town: string): string {
  return town
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function LocationContent({ town }: { town: string }) {
  const townName = formatTownName(town);

  useEffect(() => {
    document.title = `Emergency Recovery Bridge in ${townName}, OH | Live Now`;
    const existing = document.querySelector('meta[name="description"]');
    const content = `Real-time access to Suboxone near me ${townName} and Affordable Naloxone ${townName}. 8-years clean founder. 100% Private.`;
    if (existing) {
      existing.setAttribute("content", content);
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = content;
      document.head.appendChild(meta);
    }
    return () => {
      document.title = "Live Now Recovery";
    };
  }, [townName]);

  return (
    <div className="min-h-[calc(100vh-120px)] bg-background">
      {/* Hero */}
      <section className="py-16 px-4 border-b border-border">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{
              background: "oklch(0.62 0.12 218 / 0.15)",
              color: "oklch(0.75 0.10 218)",
            }}
          >
            <MapPin className="h-3.5 w-3.5" />
            Ohio Region 13 — {townName}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-5 leading-tight">
            Emergency Recovery Bridge in{" "}
            <span style={{ color: "oklch(0.62 0.12 218)" }}>{townName}</span>,
            OH
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time access to Suboxone near me {townName} and Affordable
            Naloxone {townName}. 8-years clean founder. 100% Private.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className="p-3 rounded-xl flex-shrink-0"
                  style={{ background: "oklch(0.75 0.14 55 / 0.12)" }}
                >
                  <MapPin
                    className="h-5 w-5"
                    style={{ color: "oklch(0.75 0.14 55)" }}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    Provider listings for {townName} coming soon
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    We are actively onboarding verified MAT providers in the{" "}
                    {townName} area. In the meantime, use the live map to find
                    providers near this ZIP code — all providers are verified
                    within 4 hours or automatically marked unknown.
                  </p>
                  <Link to="/">
                    <Button
                      className="text-white"
                      style={{ background: "oklch(0.62 0.12 218)" }}
                      data-ocid="location.search.button"
                    >
                      Search the Live Map
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick facts */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "MAT providers tracked", value: "Real-time" },
              { label: "Status decay rule", value: "4-hour auto" },
              { label: "Patient data stored", value: "Zero" },
            ].map((stat) => (
              <Card key={stat.label} className="border-border text-center">
                <CardContent className="p-4">
                  <p
                    className="text-xl font-bold mb-1"
                    style={{ color: "oklch(0.62 0.12 218)" }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Emergency number */}
          <Card
            className="border-border"
            style={{ background: "oklch(0.62 0.12 218 / 0.08)" }}
          >
            <CardContent className="p-5 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-bold text-foreground">
                  Need help right now?
                </p>
                <p className="text-sm text-muted-foreground">
                  Ohio MAR NOW Hotline — available 24/7
                </p>
              </div>
              <a
                href="tel:8332346343"
                className="px-4 py-2 rounded-lg font-bold text-white text-sm"
                style={{ background: "oklch(0.62 0.12 218)" }}
                data-ocid="location.emergency.button"
              >
                Call 833-234-6343
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer note */}
      <div className="py-8 text-center px-4 border-t border-border">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Heart
            className="h-4 w-4"
            style={{ color: "oklch(0.62 0.17 155)" }}
          />
          <span>
            Built by a peer 8-years clean. Your data is never stored. You are
            not alone.
          </span>
        </div>
      </div>
    </div>
  );
}

// Used by /location/$town route
export default function LocationPage() {
  const { town } = useParams({ from: "/location/$town" });
  return <LocationContent town={town} />;
}

// Used by direct SEO routes (/cleveland, /lakewood, etc.)
export function LocationPageDirect({ town }: { town: string }) {
  return <LocationContent town={town} />;
}
