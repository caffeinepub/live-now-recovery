import { Badge } from "@/components/ui/badge";
import type { ProviderWithCoords } from "@/constants/providers";
import { isProviderStale } from "@/utils/emergency";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight, Clock, MapPin, Phone } from "lucide-react";
import { motion } from "motion/react";

interface ProviderCardProps {
  provider: ProviderWithCoords;
  index: number;
}

export default function ProviderCard({ provider, index }: ProviderCardProps) {
  const isStale = isProviderStale(provider.lastVerified);
  const isActive = provider.isLive && provider.isVerified && !isStale;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07 }}
      className="bg-card rounded-xl p-4 shadow-card border border-border hover:shadow-lg transition-shadow"
      data-ocid={`provider.item.${index + 1}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Status badge */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {isActive ? (
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-live animate-pulse-slow flex-shrink-0" />
                <Badge className="bg-live/10 text-green-700 border-live/30 text-xs font-semibold">
                  LIVE NOW
                </Badge>
              </span>
            ) : isStale && provider.isLive ? (
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 flex-shrink-0" />
                <Badge
                  variant="outline"
                  className="text-yellow-700 border-yellow-400 text-xs"
                >
                  Status Unverified
                </Badge>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-300 flex-shrink-0" />
                <Badge
                  variant="outline"
                  className="text-muted-foreground text-xs"
                >
                  {provider.isVerified ? "OFFLINE" : "Not Verified"}
                </Badge>
              </span>
            )}

            {provider.isVerified && (
              <span className="flex items-center gap-1 text-teal text-xs font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Verified
              </span>
            )}
          </div>

          {/* Name */}
          <h3 className="font-bold text-foreground text-base leading-snug mb-2">
            {provider.name}
          </h3>

          {/* Address */}
          <div className="flex items-start gap-1.5 text-muted-foreground text-sm mb-1.5">
            <MapPin
              className="h-3.5 w-3.5 mt-0.5 flex-shrink-0"
              aria-hidden="true"
            />
            <span>{provider.address}</span>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-1.5 text-sm">
            <Phone
              className="h-3.5 w-3.5 text-teal flex-shrink-0"
              aria-hidden="true"
            />
            <a
              href={`tel:${provider.phone.replace(/\D/g, "")}`}
              className="text-teal font-semibold hover:underline"
              data-ocid={`provider.phone.${index + 1}`}
            >
              {provider.phone}
            </a>
          </div>

          {/* Stale warning */}
          {isStale && (
            <div className="flex items-center gap-1.5 mt-2 text-yellow-700 text-xs">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Not updated in 24+ hours</span>
            </div>
          )}
        </div>

        {/* Arrow link */}
        <Link
          to="/provider/$id"
          params={{ id: provider.id }}
          className="flex-shrink-0 flex items-center justify-center bg-teal hover:bg-teal-button text-white rounded-lg p-2.5 transition-colors min-h-[44px] min-w-[44px]"
          aria-label={`View ${provider.name} profile`}
          data-ocid={`provider.view.${index + 1}`}
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </motion.article>
  );
}
