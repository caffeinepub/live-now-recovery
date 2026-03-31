import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Car, ExternalLink } from "lucide-react";
import { useState } from "react";

interface RideModalProps {
  providerLat?: number;
  providerLng?: number;
  providerName: string;
}

export default function RideModal({
  providerLat = 41.4993,
  providerLng = -81.6944,
  providerName,
}: RideModalProps) {
  const [hasId, setHasId] = useState(false);
  const [atLocation, setAtLocation] = useState(false);
  const [open, setOpen] = useState(false);
  const bothChecked = hasId && atLocation;

  const uberDeepLink = `uber://?action=setPickup&pickup[latitude]=${providerLat}&pickup[longitude]=${providerLng}`;
  const lyftDeepLink = "lyft://ridetype?id=lyft";

  function handleClose() {
    setOpen(false);
    setHasId(false);
    setAtLocation(false);
  }

  function handleUberClick() {
    setTimeout(() => {
      window.open("https://m.uber.com", "_blank", "noopener,noreferrer");
    }, 1500);
  }

  function handleLyftClick() {
    setTimeout(() => {
      window.open("https://www.lyft.com", "_blank", "noopener,noreferrer");
    }, 1500);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
        else setOpen(true);
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="w-full bg-teal hover:bg-teal-button text-white font-bold text-base py-4 rounded-xl min-h-[52px]"
          data-ocid="ride.open_modal_button"
        >
          <Car className="h-5 w-5 mr-2" aria-hidden="true" />
          Need a Ride to {providerName}?
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md" data-ocid="ride.dialog">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Request a Ride to Treatment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <p className="text-muted-foreground text-sm">
            Before we connect you with a ride, please confirm the following:
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="has-id"
                checked={hasId}
                onCheckedChange={(v) => setHasId(!!v)}
                className="mt-0.5 h-5 w-5"
                data-ocid="ride.id.checkbox"
              />
              <Label
                htmlFor="has-id"
                className="text-sm font-medium leading-snug cursor-pointer"
              >
                I have my Photo ID ready
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="at-location"
                checked={atLocation}
                onCheckedChange={(v) => setAtLocation(!!v)}
                className="mt-0.5 h-5 w-5"
                data-ocid="ride.location.checkbox"
              />
              <Label
                htmlFor="at-location"
                className="text-sm font-medium leading-snug cursor-pointer"
              >
                I am standing at my pickup location
              </Label>
            </div>
          </div>

          {bothChecked && (
            <div className="space-y-3 pt-2" data-ocid="ride.options.panel">
              <p className="text-sm font-semibold text-foreground">
                Choose your ride:
              </p>
              <a
                href={uberDeepLink}
                className="flex items-center justify-center gap-2 w-full bg-black text-white font-bold py-4 rounded-xl text-base hover:bg-gray-800 transition-colors min-h-[52px]"
                data-ocid="ride.uber.button"
                onClick={handleUberClick}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Open Uber
              </a>
              <a
                href={lyftDeepLink}
                className="flex items-center justify-center gap-2 w-full font-bold py-4 rounded-xl text-base text-white hover:opacity-90 transition-opacity min-h-[52px]"
                style={{ background: "oklch(0.55 0.24 315)" }}
                data-ocid="ride.lyft.button"
                onClick={handleLyftClick}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Open Lyft
              </a>
              <p className="text-center text-xs text-muted-foreground">
                If the app doesn&apos;t open, visit{" "}
                <a
                  href="https://uber.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  uber.com
                </a>{" "}
                or{" "}
                <a
                  href="https://lyft.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  lyft.com
                </a>
              </p>
            </div>
          )}

          {!bothChecked && (
            <p className="text-xs text-muted-foreground text-center">
              Both items above must be confirmed to request a ride.
            </p>
          )}
        </div>

        <Button
          variant="outline"
          onClick={handleClose}
          className="w-full"
          data-ocid="ride.close.button"
        >
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
