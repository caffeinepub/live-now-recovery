import ImpactPulse from "@/components/ImpactPulse";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProviderWithCoords } from "@/constants/providers";
import {
  useAllProvidersAdmin,
  useContactMessages,
  useIsAdmin,
  useSystemRiskLevel,
  useVerifyProvider,
} from "@/hooks/useQueries";
import { isProviderStale } from "@/utils/emergency";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquare,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { toast } from "sonner";

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: isCheckingAdmin } = useIsAdmin();
  const { data: providers = [], isLoading: isLoadingProviders } =
    useAllProvidersAdmin();
  const verifyMutation = useVerifyProvider();
  const { data: riskLevel = "GREEN" } = useSystemRiskLevel();
  const { data: contactMessages = [], isLoading: isLoadingMessages } =
    useContactMessages();

  useEffect(() => {
    if (!isCheckingAdmin && isAdmin === false) {
      navigate({ to: "/" });
    }
  }, [isAdmin, isCheckingAdmin, navigate]);

  async function handleVerify(provider: ProviderWithCoords) {
    try {
      await verifyMutation.mutateAsync({
        id: provider.id,
        verified: !provider.isVerified,
      });
      toast.success(
        provider.isVerified
          ? `${provider.name} has been unverified.`
          : `${provider.name} is now verified!`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    }
  }

  if (isCheckingAdmin) {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center"
        data-ocid="admin.loading_state"
      >
        <Loader2
          className="h-10 w-10 animate-spin text-primary"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4"
        data-ocid="admin.error_state"
      >
        <AlertCircle
          className="h-12 w-12 text-destructive mb-4"
          aria-hidden="true"
        />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">
          You must be an admin to view this page.
        </p>
      </div>
    );
  }

  return (
    <div
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      data-ocid="admin.panel"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="h-7 w-7 text-teal" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-extrabold">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Review and verify MAT provider listings.
            </p>
          </div>
        </div>

        {riskLevel === "RED" && (
          <div
            className="flex items-center gap-3 rounded-lg bg-red-600 px-4 py-3 text-white font-semibold text-sm mb-4"
            data-ocid="admin.sentinel.error_state"
          >
            <AlertTriangle
              className="h-5 w-5 flex-shrink-0"
              aria-hidden="true"
            />
            <span>
              SENTINEL ALERT: High search demand in a ZIP with zero active
              providers. Immediate attention required.
            </span>
          </div>
        )}

        {isLoadingProviders ? (
          <div
            className="flex justify-center py-16"
            data-ocid="admin.table.loading_state"
          >
            <Loader2
              className="h-8 w-8 animate-spin text-primary"
              aria-hidden="true"
            />
          </div>
        ) : providers.length === 0 ? (
          <div
            className="text-center py-16 text-muted-foreground"
            data-ocid="admin.table.empty_state"
          >
            <p className="font-semibold text-foreground mb-1">
              No providers registered yet.
            </p>
            <p className="text-sm">
              Providers will appear here after they register.
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl border border-border overflow-hidden shadow-card"
            data-ocid="admin.table"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="font-bold">Clinic Name</TableHead>
                  <TableHead>ZIP</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Live</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider, i) => {
                  const stale = isProviderStale(provider.lastVerified);
                  const lastMs = Number(provider.lastVerified / 1000000n);
                  const lastDate = new Date(lastMs).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  );

                  return (
                    <TableRow
                      key={provider.id}
                      data-ocid={`admin.row.item.${i + 1}`}
                    >
                      <TableCell className="font-semibold">
                        {provider.name}
                      </TableCell>
                      <TableCell>{provider.zip}</TableCell>
                      <TableCell className="text-sm">
                        {provider.phone}
                      </TableCell>
                      <TableCell>
                        {provider.isLive ? (
                          <span className="flex items-center gap-1.5 text-green-600 font-medium text-sm">
                            <span className="h-2 w-2 rounded-full bg-live" />
                            Live
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Offline
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {provider.isVerified ? (
                          <Badge className="bg-teal/10 text-teal border-teal/30 text-xs">
                            <CheckCircle2
                              className="h-3 w-3 mr-1"
                              aria-hidden="true"
                            />
                            Verified
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground text-xs"
                          >
                            <XCircle
                              className="h-3 w-3 mr-1"
                              aria-hidden="true"
                            />
                            Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-sm ${
                            stale
                              ? "text-yellow-600 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {stale ? "\u26a0 " : ""}
                          {lastDate}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={provider.isVerified ? "outline" : "default"}
                          onClick={() => handleVerify(provider)}
                          disabled={verifyMutation.isPending}
                          className={
                            provider.isVerified
                              ? ""
                              : "bg-teal hover:bg-teal-button text-white border-0"
                          }
                          data-ocid={`admin.verify.button.${i + 1}`}
                        >
                          {verifyMutation.isPending ? (
                            <Loader2
                              className="h-3.5 w-3.5 animate-spin"
                              aria-hidden="true"
                            />
                          ) : provider.isVerified ? (
                            "Unverify"
                          ) : (
                            "Verify"
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ── Impact Pulse — Proof of Presence live map ── */}
        <div className="mt-8">
          <ImpactPulse />
        </div>

        {/* ── Contact Messages ── */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-5">
            <MessageSquare className="h-6 w-6 text-teal" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-extrabold">Contact Messages</h2>
              <p className="text-muted-foreground text-sm">
                Partner inquiries submitted via the Contact page.
              </p>
            </div>
          </div>

          {isLoadingMessages ? (
            <div
              className="flex justify-center py-10"
              data-ocid="admin.contact.loading_state"
            >
              <Loader2
                className="h-7 w-7 animate-spin text-primary"
                aria-hidden="true"
              />
            </div>
          ) : contactMessages.length === 0 ? (
            <div
              className="text-center py-12 border border-dashed border-border rounded-xl text-muted-foreground"
              data-ocid="admin.contact.empty_state"
            >
              <Mail
                className="h-8 w-8 mx-auto mb-3 opacity-40"
                aria-hidden="true"
              />
              <p className="font-medium text-foreground mb-1">
                No messages yet.
              </p>
              <p className="text-sm">
                Partner inquiries will appear here after submission.
              </p>
            </div>
          ) : (
            <div className="space-y-4" data-ocid="admin.contact.list">
              {contactMessages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border rounded-xl p-5"
                  data-ocid={`admin.contact.item.${i + 1}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-teal/10 rounded-lg p-2">
                        <Building2
                          className="h-4 w-4 text-teal"
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{msg.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {msg.organization}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {formatTimestamp(msg.timestamp)}
                    </p>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed bg-muted/40 rounded-lg px-4 py-3">
                    {msg.message}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
