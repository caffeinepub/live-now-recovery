import type { AppUserRole } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useRole } from "@/hooks/useRole";
import { useNavigate } from "@tanstack/react-router";
import {
  Heart,
  Loader2,
  LogIn,
  ShieldAlert,
  Stethoscope,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type RoleChoice = "User" | "Helper" | "Clinic";

const ROLE_CARDS: {
  role: RoleChoice;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}[] = [
  {
    role: "User",
    label: "I Need Help",
    subtitle: "Find MAT providers near you",
    icon: <Heart className="h-8 w-8" />,
    color: "text-emergency",
    bg: "from-red-50 to-red-100/50 border-red-200 hover:border-red-400",
  },
  {
    role: "Helper",
    label: "I Want to Help",
    subtitle: "Go live as a Community Helper in your area",
    icon: <Users className="h-8 w-8" />,
    color: "text-teal",
    bg: "from-teal-50 to-teal-100/50 border-teal-200 hover:border-teal-400",
  },
  {
    role: "Clinic",
    label: "I Represent a Clinic",
    subtitle: "Manage your clinic's availability and naloxone stock",
    icon: <Stethoscope className="h-8 w-8" />,
    color: "text-navy",
    bg: "from-blue-50 to-blue-100/50 border-blue-200 hover:border-blue-400",
  },
];

function roleToDestination(role: AppUserRole): string {
  if ("Helper" in role) return "/helper";
  if ("Clinic" in role) return "/dashboard";
  if ("Admin" in role) return "/admin";
  return "/";
}

export default function RegisterPage() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { role, isLoading: isRoleLoading, refetch } = useRole();
  const { actor } = useActor();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<RoleChoice | null>(null);
  const [alias, setAlias] = useState("");
  const [zip, setZip] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already has a role, redirect immediately
  useEffect(() => {
    if (role !== null && role !== undefined) {
      navigate({ to: roleToDestination(role) });
    }
  }, [role, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole || !alias.trim() || !zip.trim()) {
      toast.error("Please fill out all fields.");
      return;
    }
    if (!/^\d{5}$/.test(zip.trim())) {
      toast.error("Please enter a valid 5-digit ZIP code.");
      return;
    }
    if (!actor) {
      toast.error("Not connected to backend. Please try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const roleArg: AppUserRole = { [selectedRole]: null } as AppUserRole;
      await (actor as any).registerRole(roleArg, alias.trim(), zip.trim());
      toast.success(`Welcome! You're registered as a ${selectedRole}.`);
      await refetch();
      // Navigate based on chosen role
      const dest =
        selectedRole === "Helper"
          ? "/helper"
          : selectedRole === "Clinic"
            ? "/dashboard"
            : "/";
      navigate({ to: dest });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("already")) {
        toast.error("You're already registered. Redirecting...");
        await refetch();
      } else if (msg.toLowerCase().includes("admin")) {
        toast.error(
          "Admin role cannot be self-assigned. Contact the platform administrator.",
        );
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Loading state
  if (!isAuthenticated && !isRoleLoading) {
    return (
      <div
        className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16"
        data-ocid="register.login_prompt.panel"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="mx-auto mb-6 w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-teal" />
          </div>
          <h1 className="text-2xl font-extrabold mb-2">Sign In to Register</h1>
          <p className="text-muted-foreground mb-6">
            Please connect with Internet Identity to create your role.
          </p>
          <Button
            size="lg"
            onClick={() => login()}
            disabled={isLoggingIn}
            className="bg-teal hover:bg-teal-dark text-white font-bold border-0 w-full min-h-[52px]"
            data-ocid="register.login.button"
          >
            {isLoggingIn ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <LogIn className="h-5 w-5 mr-2" />
            )}
            {isLoggingIn ? "Connecting..." : "Connect with Internet Identity"}
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isRoleLoading) {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center"
        data-ocid="register.loading_state"
      >
        <Loader2 className="h-10 w-10 animate-spin text-teal" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl font-extrabold mb-2 tracking-tight">
          Choose Your Role
        </h1>
        <p className="text-muted-foreground text-base">
          One role per identity. This cannot be changed later.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-teal/10 text-teal text-xs font-semibold px-4 py-2 rounded-full">
          <ShieldAlert className="h-3.5 w-3.5" />
          We never store your real name or any personal health information.
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {!selectedRole ? (
          <motion.div
            key="role-select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-4 sm:grid-cols-3"
            data-ocid="register.role.panel"
          >
            {ROLE_CARDS.map((card, i) => (
              <motion.button
                key={card.role}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => setSelectedRole(card.role)}
                className={`relative bg-gradient-to-br ${card.bg} border-2 rounded-2xl p-6 text-left transition-all duration-150 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-teal`}
                data-ocid={`register.${card.role.toLowerCase()}.button`}
              >
                <div className={`${card.color} mb-4`}>{card.icon}</div>
                <h2 className="font-extrabold text-lg leading-tight mb-1">
                  {card.label}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {card.subtitle}
                </p>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="profile-form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-sm mx-auto"
          >
            <button
              type="button"
              onClick={() => setSelectedRole(null)}
              className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1 transition-colors"
              data-ocid="register.back.button"
            >
              ← Back to role selection
            </button>

            <div
              className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-6 ${
                selectedRole === "User"
                  ? "bg-red-100 text-red-700"
                  : selectedRole === "Helper"
                    ? "bg-teal/10 text-teal"
                    : "bg-blue-100 text-blue-700"
              }`}
            >
              {selectedRole === "User" && <Heart className="h-3 w-3" />}
              {selectedRole === "Helper" && <Users className="h-3 w-3" />}
              {selectedRole === "Clinic" && <Stethoscope className="h-3 w-3" />}
              Registering as:{" "}
              {ROLE_CARDS.find((c) => c.role === selectedRole)?.label}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="alias" className="font-semibold text-sm">
                  Display Name
                </Label>
                <Input
                  id="alias"
                  placeholder="Choose a display name — no real name needed"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  maxLength={40}
                  autoComplete="off"
                  data-ocid="register.alias.input"
                />
                <p className="text-xs text-muted-foreground">
                  Use a nickname or pseudonym. No real names required.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="zip" className="font-semibold text-sm">
                  ZIP Code
                </Label>
                <Input
                  id="zip"
                  placeholder="e.g. 44102"
                  value={zip}
                  onChange={(e) =>
                    setZip(e.target.value.replace(/\D/g, "").slice(0, 5))
                  }
                  inputMode="numeric"
                  maxLength={5}
                  autoComplete="postal-code"
                  data-ocid="register.zip.input"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || !alias.trim() || zip.length !== 5}
                className="w-full bg-teal hover:bg-teal-dark text-white font-bold border-0 min-h-[52px] text-base"
                data-ocid="register.submit.button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Registering...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
