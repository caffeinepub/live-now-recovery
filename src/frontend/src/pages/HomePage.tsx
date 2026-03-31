import MarkCubanCard from "@/components/MarkCubanCard";
import ProviderCard from "@/components/ProviderCard";
import ProviderMap from "@/components/ProviderMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProviderWithCoords } from "@/constants/providers";
import { useProviders, useRecordSearchIntent } from "@/hooks/useQueries";
import { AlertCircle, Loader2, MapPin, Search } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useState } from "react";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const { data: providers = [], isLoading } = useProviders();
  const recordSearch = useRecordSearchIntent();

  function filterProviders(all: ProviderWithCoords[]): ProviderWithCoords[] {
    let results = all;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      results = results.filter(
        (p) =>
          p.zip.includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q),
      );
    }

    if (nearbyOnly && userCoords) {
      results = results.filter((p) => {
        const dist = Math.sqrt(
          (p.lat - userCoords.lat) ** 2 + (p.lng - userCoords.lng) ** 2,
        );
        return dist < 0.36; // ~25 miles
      });
    }

    return results;
  }

  const handleNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearbyOnly(true);
        setGeoLoading(false);
        setSearchQuery("");
      },
      () => {
        setGeoError("Could not get your location. Try searching by ZIP code.");
        setGeoLoading(false);
      },
      { timeout: 8000 },
    );
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setNearbyOnly(false);
    const trimmed = searchQuery.trim();
    if (/^\d{5}$/.test(trimmed)) {
      recordSearch.mutate(trimmed);
    }
  }

  const displayedProviders = filterProviders(providers);
  const liveCount = providers.filter((p) => p.isLive && p.isVerified).length;

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative text-white overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.22 0.038 225) 0%, oklch(0.28 0.04 222) 50%, oklch(0.36 0.065 196) 100%)",
          minHeight: "360px",
        }}
        data-ocid="home.section"
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(11,107,115,0.3) 0%, transparent 50%)",
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6"
          >
            <span className="h-2 w-2 rounded-full bg-live animate-pulse-slow" />
            {liveCount} providers live now in Ohio Region 13
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-4"
          >
            Find MAT Treatment
            <br />
            <span className="text-teal-light">Near You, Right Now</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-on-dark text-lg mb-8 max-w-2xl mx-auto"
          >
            Real-time, verified access to Medication-Assisted Treatment
            providers. Anonymous. No account required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
            >
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="text"
                  placeholder="Search by city, ZIP code, or clinic name\u2026"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setNearbyOnly(false);
                  }}
                  className="pl-12 h-14 text-base rounded-xl bg-white text-foreground border-0 shadow-lg focus-visible:ring-2 focus-visible:ring-teal"
                  data-ocid="home.search_input"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="lg"
                  className="h-14 px-6 bg-teal hover:bg-teal-button text-white font-bold rounded-xl border-0 shadow-lg flex-1 sm:flex-none"
                  data-ocid="home.search.button"
                >
                  Search
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={handleNearMe}
                  disabled={geoLoading}
                  className="h-14 px-4 rounded-xl bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white flex-shrink-0"
                  data-ocid="home.near_me.button"
                >
                  {geoLoading ? (
                    <Loader2
                      className="h-5 w-5 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  )}
                  <span className="ml-1.5 hidden sm:inline">Near Me</span>
                </Button>
              </div>
            </form>

            {nearbyOnly && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-sm text-on-dark flex items-center justify-center gap-2"
              >
                <span>Showing providers near your location.</span>
                <button
                  type="button"
                  onClick={() => setNearbyOnly(false)}
                  className="underline hover:text-white transition-colors"
                >
                  Show all
                </button>
              </motion.div>
            )}

            {geoError && (
              <div
                className="mt-2 flex items-center justify-center gap-2 text-sm text-red-300"
                data-ocid="home.geo.error_state"
              >
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <span>{geoError}</span>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <section
        className="py-8 px-4 sm:px-6 lg:px-8"
        style={{ background: "oklch(0.44 0.078 196)" }}
        data-ocid="home.results.section"
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">
              {searchQuery || nearbyOnly
                ? `${displayedProviders.length} result${displayedProviders.length !== 1 ? "s" : ""} found`
                : "MAT Providers \u2014 Ohio Region 13"}
            </h2>
            <div className="flex items-center gap-3 text-sm text-on-dark">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-live" />
                Live
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-gray-400" />
                Offline
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Map */}
            <div className="h-[340px] lg:h-[520px] rounded-xl overflow-hidden shadow-card">
              {isLoading ? (
                <div
                  className="h-full flex items-center justify-center rounded-xl"
                  style={{ background: "oklch(0.36 0.065 196)" }}
                  data-ocid="home.map.loading_state"
                >
                  <Loader2
                    className="h-8 w-8 animate-spin text-white"
                    aria-hidden="true"
                  />
                </div>
              ) : (
                <ProviderMap
                  providers={
                    displayedProviders.length > 0
                      ? displayedProviders
                      : providers
                  }
                />
              )}
            </div>

            {/* Provider list + Cuban card */}
            <div className="flex flex-col gap-4">
              <MarkCubanCard />

              {isLoading ? (
                <div
                  className="flex items-center justify-center py-12"
                  data-ocid="home.providers.loading_state"
                >
                  <Loader2
                    className="h-8 w-8 animate-spin text-white"
                    aria-hidden="true"
                  />
                </div>
              ) : displayedProviders.length === 0 ? (
                <div
                  className="text-center py-12 text-on-dark"
                  data-ocid="provider.empty_state"
                >
                  <Search
                    className="h-10 w-10 mx-auto mb-3 opacity-50"
                    aria-hidden="true"
                  />
                  <p className="font-semibold text-white mb-1">
                    No providers found
                  </p>
                  <p className="text-sm">
                    Try a different search term or ZIP code.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setNearbyOnly(false);
                    }}
                    className="mt-3 underline text-sm text-on-dark hover:text-white"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[400px] lg:max-h-[340px] pr-1">
                  {displayedProviders.map((provider, i) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
