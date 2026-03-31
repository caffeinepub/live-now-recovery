import VolunteerQR from "@/components/VolunteerQR";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  useAddProvider,
  useClinicStatus,
  useProviderDashboard,
  useToggleLiveStatus,
  useUpdateClinicStatus,
} from "@/hooks/useQueries";
import { isClinicRole, useRole } from "@/hooks/useRole";
import { isProviderStale } from "@/utils/emergency";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  LogIn,
  Plus,
  Stethoscope,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RegistrationForm {
  name: string;
  address: string;
  zip: string;
  phone: string;
}

function ClinicSettingsPanel({ providerId }: { providerId: string }) {
  const { data: currentStatus } = useClinicStatus(providerId);
  const updateMutation = useUpdateClinicStatus();
  const [naloxone, setNaloxone] = useState<
    "Available" | "LimitedStock" | "OutOfStock"
  >("Available");
  const [accepting, setAccepting] = useState(true);

  // Initialize from current status when loaded
  useEffect(() => {
    if (currentStatus) {
      if ("Available" in currentStatus.naloxone) setNaloxone("Available");
      else if ("LimitedStock" in currentStatus.naloxone)
        setNaloxone("LimitedStock");
      else setNaloxone("OutOfStock");
      setAccepting(currentStatus.acceptingPatients);
    }
  }, [currentStatus]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    try {
      type NS =
        | { Available: null }
        | { LimitedStock: null }
        | { OutOfStock: null };
      const naloxoneArg = { [naloxone]: null } as unknown as NS;
      await updateMutation.mutateAsync({
        naloxone: naloxoneArg,
        acceptingPatients: accepting,
      });
      toast.success("Clinic status updated successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed.");
    }
  }

  const NALOXONE_OPTIONS = [
    {
      value: "Available",
      label: "Available",
      color: "bg-green-100 text-green-700 border-green-300",
    },
    {
      value: "LimitedStock",
      label: "Limited Stock",
      color: "bg-amber-100 text-amber-700 border-amber-300",
    },
    {
      value: "OutOfStock",
      label: "Out of Stock",
      color: "bg-red-100 text-red-700 border-red-300",
    },
  ] as const;

  return (
    <Card
      className="border-teal/20 bg-teal/5 mb-6"
      data-ocid="dashboard.clinic.panel"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-teal" aria-hidden="true" />
          <CardTitle className="text-base font-extrabold">
            Clinic Settings
          </CardTitle>
        </div>
        <CardDescription>
          Update your naloxone availability and patient intake status in real
          time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdate} className="space-y-5">
          <div>
            <p className="text-sm font-semibold mb-3">Naloxone Stock</p>
            <div className="flex flex-wrap gap-2">
              {NALOXONE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNaloxone(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                    naloxone === opt.value
                      ? `${opt.color} ring-2 ring-offset-1 ring-teal`
                      : "bg-background text-muted-foreground border-border hover:border-teal/40"
                  }`}
                  data-ocid={`dashboard.clinic.naloxone_${opt.value.toLowerCase()}.toggle`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={accepting}
              onClick={() => setAccepting((v) => !v)}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
                accepting ? "border-teal bg-teal" : "border-border bg-muted"
              }`}
              data-ocid="dashboard.clinic.accepting.switch"
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform mt-0.5 ${
                  accepting ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-sm font-medium">
              {accepting
                ? "Accepting New Patients"
                : "Not Accepting New Patients"}
            </span>
          </div>

          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-teal hover:bg-teal-dark text-white font-bold border-0 h-11 px-6"
            data-ocid="dashboard.clinic.update.button"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Updating...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                Update Status
              </>
            )}
          </Button>
        </form>

        {currentStatus && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Last updated:{" "}
              {new Date(
                Number(currentStatus.updatedAt / 1_000_000n),
              ).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { role } = useRole();
  const navigate = useNavigate();

  const { data: provider, isLoading } = useProviderDashboard();
  const toggleMutation = useToggleLiveStatus();
  const addMutation = useAddProvider();

  const [form, setForm] = useState<RegistrationForm>({
    name: "",
    address: "",
    zip: "",
    phone: "",
  });

  function handleFormChange(field: keyof RegistrationForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.address || !form.zip || !form.phone) {
      toast.error("Please fill in all fields.");
      return;
    }
    try {
      await addMutation.mutateAsync(form);
      toast.success("Registration submitted! Awaiting admin verification.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed.");
    }
  }

  async function handleToggle() {
    if (!provider) return;
    try {
      await toggleMutation.mutateAsync(provider.id);
      toast.success(`You are now ${provider.isLive ? "OFFLINE" : "LIVE"}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Toggle failed.");
    }
  }

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center px-4"
        data-ocid="dashboard.page"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="bg-navy rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <LogIn className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Provider Portal</h1>
          <p className="text-muted-foreground mb-6">
            Log in with Internet Identity to manage your live availability
            status.
          </p>
          <Button
            size="lg"
            onClick={login}
            disabled={isLoggingIn}
            className="bg-teal hover:bg-teal-button text-white font-bold px-8 py-4 min-h-[52px] w-full"
            data-ocid="dashboard.login.primary_button"
          >
            {isLoggingIn ? (
              <Loader2
                className="h-5 w-5 animate-spin mr-2"
                aria-hidden="true"
              />
            ) : (
              <LogIn className="h-5 w-5 mr-2" aria-hidden="true" />
            )}
            {isLoggingIn ? "Connecting..." : "Log In to Dashboard"}
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center"
        data-ocid="dashboard.loading_state"
      >
        <Loader2
          className="h-10 w-10 animate-spin text-primary"
          aria-hidden="true"
        />
      </div>
    );
  }

  /* No provider record yet — show registration form */
  if (!provider) {
    return (
      <div
        className="max-w-lg mx-auto px-4 sm:px-6 py-10"
        data-ocid="dashboard.register.section"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-extrabold">
                Register Your Clinic
              </CardTitle>
              <CardDescription>
                Submit your clinic details. An admin will verify your NPI and
                grant your Verified badge.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="clinic-name">Clinic Name *</Label>
                  <Input
                    id="clinic-name"
                    placeholder="e.g. Brightside Recovery"
                    value={form.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    required
                    data-ocid="dashboard.clinic_name.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="clinic-address">Street Address *</Label>
                  <Input
                    id="clinic-address"
                    placeholder="e.g. 1375 Euclid Ave, Cleveland, OH"
                    value={form.address}
                    onChange={(e) =>
                      handleFormChange("address", e.target.value)
                    }
                    required
                    data-ocid="dashboard.address.input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="clinic-zip">ZIP Code *</Label>
                    <Input
                      id="clinic-zip"
                      placeholder="44115"
                      value={form.zip}
                      onChange={(e) => handleFormChange("zip", e.target.value)}
                      required
                      data-ocid="dashboard.zip.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="clinic-phone">Phone *</Label>
                    <Input
                      id="clinic-phone"
                      placeholder="(216) 555-0100"
                      value={form.phone}
                      onChange={(e) =>
                        handleFormChange("phone", e.target.value)
                      }
                      required
                      data-ocid="dashboard.phone.input"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-teal hover:bg-teal-button text-white font-bold mt-2 min-h-[52px]"
                  disabled={addMutation.isPending}
                  data-ocid="dashboard.register.submit_button"
                >
                  {addMutation.isPending ? (
                    <Loader2
                      className="h-5 w-5 animate-spin mr-2"
                      aria-hidden="true"
                    />
                  ) : (
                    <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
                  )}
                  {addMutation.isPending
                    ? "Submitting..."
                    : "Submit for Verification"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  /* Has provider record — show dashboard */
  const isStale = isProviderStale(provider.lastVerified);

  function handleViewDirectory() {
    navigate({ to: "/" });
  }

  return (
    <div
      className="max-w-xl mx-auto px-4 sm:px-6 py-10"
      data-ocid="dashboard.panel"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div>
          <h1 className="text-2xl font-extrabold">Provider Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your live availability status.
          </p>
        </div>

        {/* Provider info card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {provider.isVerified ? (
                    <CheckCircle2
                      className="h-5 w-5 text-teal"
                      aria-hidden="true"
                    />
                  ) : (
                    <AlertCircle
                      className="h-5 w-5 text-yellow-500"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      provider.isVerified ? "text-teal" : "text-yellow-600"
                    }`}
                  >
                    {provider.isVerified
                      ? "Verified Provider"
                      : "Pending Verification"}
                  </span>
                </div>
                <h2 className="text-xl font-bold">{provider.name}</h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {provider.address}
                </p>
                <p className="text-sm mt-0.5">{provider.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stale warning */}
        {isStale && (
          <div
            className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800"
            data-ocid="dashboard.stale.error_state"
          >
            <AlertCircle
              className="h-5 w-5 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold">Status not updated in 24+ hours</p>
              <p>
                Your listing is flagged as &quot;Status Unverified&quot;. Toggle
                your status to re-verify.
              </p>
            </div>
          </div>
        )}

        {/* Clinic Settings — shown if user has Clinic role */}
        {role && isClinicRole(role) && provider?.id && (
          <ClinicSettingsPanel providerId={provider.id} />
        )}

        {/* Live toggle */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center gap-3 justify-center">
                <Clock
                  className="h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="text-sm text-muted-foreground">
                  Current status:{" "}
                  <span
                    className={`font-bold ${
                      provider.isLive ? "text-live" : "text-muted-foreground"
                    }`}
                  >
                    {provider.isLive ? "LIVE — Accepting Patients" : "OFFLINE"}
                  </span>
                </p>
              </div>

              <Button
                size="lg"
                onClick={handleToggle}
                disabled={toggleMutation.isPending}
                className={`w-full text-white font-bold text-lg py-5 rounded-xl min-h-[60px] transition-colors ${
                  provider.isLive
                    ? "bg-gray-500 hover:bg-gray-600"
                    : "bg-live hover:bg-green-500 text-navy"
                }`}
                data-ocid="dashboard.toggle.primary_button"
              >
                {toggleMutation.isPending ? (
                  <Loader2
                    className="h-6 w-6 animate-spin mr-2"
                    aria-hidden="true"
                  />
                ) : provider.isLive ? (
                  <ToggleLeft className="h-6 w-6 mr-2" aria-hidden="true" />
                ) : (
                  <ToggleRight className="h-6 w-6 mr-2" aria-hidden="true" />
                )}
                {toggleMutation.isPending
                  ? "Updating..."
                  : provider.isLive
                    ? "GO OFFLINE"
                    : "GO LIVE"}
              </Button>

              <p className="text-xs text-muted-foreground">
                Toggling updates your timestamp and re-verifies your status in
                the directory.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Proof of Presence — Handoff QR (verified providers only) */}
        {provider.isVerified && <VolunteerQR provider={provider} />}

        <Button
          variant="outline"
          onClick={handleViewDirectory}
          className="w-full"
          data-ocid="dashboard.view_directory.button"
        >
          View Public Directory
        </Button>
      </motion.div>
    </div>
  );
}
