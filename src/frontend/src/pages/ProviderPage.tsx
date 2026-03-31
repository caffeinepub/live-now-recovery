import MarkCubanCard from "@/components/MarkCubanCard";
import RideModal from "@/components/RideModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProviderById } from "@/hooks/useQueries";
import { isProviderStale } from "@/utils/emergency";
import { Link, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Loader2,
  MapPin,
  Phone,
} from "lucide-react";
import { motion } from "motion/react";

export default function ProviderPage() {
  const params = useParams({ strict: false }) as { id?: string };
  const id = params.id ?? "";
  const { data: provider, isLoading } = useProviderById(id);

  if (isLoading) {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center"
        data-ocid="provider_page.loading_state"
      >
        <Loader2
          className="h-10 w-10 animate-spin text-primary"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (!provider) {
    return (
      <div
        className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4"
        data-ocid="provider_page.error_state"
      >
        <AlertCircle
          className="h-12 w-12 text-destructive mb-4"
          aria-hidden="true"
        />
        <h1 className="text-2xl font-bold mb-2">Provider Not Found</h1>
        <p className="text-muted-foreground mb-6">
          This provider listing may have been removed.
        </p>
        <Button asChild data-ocid="provider_page.back.button">
          <Link to="/">Back to Directory</Link>
        </Button>
      </div>
    );
  }

  const isStale = isProviderStale(provider.lastVerified);
  const isActive = provider.isLive && provider.isVerified && !isStale;
  const lastVerifiedMs = Number(provider.lastVerified / 1000000n);
  const lastVerifiedDate = new Date(lastVerifiedMs).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <div
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      data-ocid="provider_page.section"
    >
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        data-ocid="provider_page.back.link"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Back to Directory
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main provider info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2 space-y-4"
        >
          {/* Provider header card */}
          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            {/* Status */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {isActive ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-live animate-pulse-slow" />
                  <Badge className="bg-live/10 text-green-700 border-live/30 font-bold text-sm px-3 py-1">
                    LIVE NOW — Accepting Patients
                  </Badge>
                </span>
              ) : isStale && provider.isLive ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <Badge
                    variant="outline"
                    className="text-yellow-700 border-yellow-400"
                  >
                    Status Unverified (24h+)
                  </Badge>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-gray-300" />
                  <Badge variant="outline" className="text-muted-foreground">
                    {provider.isVerified ? "Currently Offline" : "Not Verified"}
                  </Badge>
                </span>
              )}

              {provider.isVerified && (
                <span className="flex items-center gap-1.5 text-teal text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  NPI Verified Provider
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-4">
              {provider.name}
            </h1>

            {/* Address */}
            <div className="flex items-start gap-2 text-muted-foreground mb-3">
              <MapPin
                className="h-5 w-5 mt-0.5 flex-shrink-0 text-teal"
                aria-hidden="true"
              />
              <span className="text-base">{provider.address}</span>
            </div>

            {/* Phone — large for easy tapping */}
            <div className="flex items-center gap-2 mb-4">
              <Phone
                className="h-5 w-5 text-teal flex-shrink-0"
                aria-hidden="true"
              />
              <a
                href={`tel:${provider.phone.replace(/\D/g, "")}`}
                className="text-xl font-bold text-teal hover:underline"
                data-ocid="provider_page.phone.button"
              >
                {provider.phone}
              </a>
            </div>

            {/* Last verified */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>Status last updated: {lastVerifiedDate}</span>
            </div>

            {isStale && (
              <div
                className="mt-3 flex items-center gap-2 text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-sm"
                data-ocid="provider_page.stale.error_state"
              >
                <AlertCircle
                  className="h-4 w-4 flex-shrink-0"
                  aria-hidden="true"
                />
                This provider hasn&apos;t updated their status in over 24 hours.
                Call to confirm availability.
              </div>
            )}
          </div>

          {/* Call to action — big phone button */}
          <Button
            asChild
            size="lg"
            className="w-full bg-navy hover:bg-navy-light text-white font-bold text-lg py-5 rounded-xl min-h-[60px]"
            data-ocid="provider_page.call.primary_button"
          >
            <a href={`tel:${provider.phone.replace(/\D/g, "")}`}>
              <Phone className="h-6 w-6 mr-2" aria-hidden="true" />
              Call Now: {provider.phone}
            </a>
          </Button>

          {/* Ride modal */}
          <RideModal
            providerLat={provider.lat}
            providerLng={provider.lng}
            providerName={provider.name}
          />
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="space-y-4"
        >
          <MarkCubanCard />

          {/* No-PHI notice */}
          <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">
              Your privacy is protected.
            </p>
            <p>
              This platform never stores your name, contact info, or medical
              history. All searches are anonymous.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
