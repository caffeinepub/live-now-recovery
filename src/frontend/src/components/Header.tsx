import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useIsAdmin } from "@/hooks/useQueries";
import { isAdminRole, isHelperRole, roleLabel, useRole } from "@/hooks/useRole";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Heart,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Phone,
  ShieldCheck,
  Target,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

function RoleBadge({ className = "" }: { className?: string }) {
  const { role } = useRole();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  if (!isAuthenticated) return null;

  if (role === null) {
    return (
      <Link
        to="/register"
        className={`text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400 text-amber-900 hover:bg-amber-300 transition-colors whitespace-nowrap ${className}`}
        data-ocid="header.register.link"
      >
        Complete Registration
      </Link>
    );
  }

  if (!role) return null;

  const label = roleLabel(role);
  const isHelper = isHelperRole(role);
  const isAdmin = isAdminRole(role);

  return (
    <span
      className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
        isAdmin
          ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
          : isHelper
            ? "bg-teal/20 text-teal-light border border-teal/30"
            : "bg-white/10 text-white/70 border border-white/20"
      } ${className}`}
      data-ocid="header.role.badge"
    >
      {isHelper ? `${label} 🟢` : label}
    </span>
  );
}

export default function Header() {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { role, isLoading: roleLoading } = useRole();

  function handleLogin() {
    login();
  }

  function handleLogout() {
    clear();
    navigate({ to: "/" });
  }

  /**
   * Smart routing for the "Be a Helper" / helper CTA.
   * - Not logged in → /register
   * - Logged in, no role yet → /register
   * - Logged in, Helper or Admin → /helper
   * - Logged in, User or Clinic → /register (already registered, will see info)
   */
  function handleHelperClick(e: React.MouseEvent) {
    e.preventDefault();
    if (!isAuthenticated || roleLoading) {
      navigate({ to: "/register" });
      return;
    }
    if (role === null || role === undefined) {
      navigate({ to: "/register" });
      return;
    }
    if (isHelperRole(role) || isAdminRole(role)) {
      navigate({ to: "/helper" });
    } else {
      // User or Clinic — send to register so they can see options
      navigate({ to: "/register" });
    }
  }

  return (
    <header className="bg-navy text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            data-ocid="header.link"
          >
            <div className="bg-teal rounded-full p-1.5">
              <Heart
                className="h-5 w-5 text-white fill-white"
                aria-hidden="true"
              />
            </div>
            <span className="font-bold text-lg tracking-tight">
              <span className="text-teal-light">Live Now</span>{" "}
              <span className="text-white">Recovery</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-on-dark hover:text-white transition-colors text-sm font-medium"
              data-ocid="header.find_care.link"
            >
              Find Care
            </Link>
            <a
              href="/helper"
              className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
              style={{ color: "oklch(0.80 0.12 196)" }}
              onClick={handleHelperClick}
              data-ocid="header.helper.link"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Be a Helper
            </a>
            <Link
              to="/mission"
              className="text-on-dark hover:text-white transition-colors text-sm font-medium"
              data-ocid="header.mission.link"
            >
              Mission
            </Link>
            <Link
              to="/about"
              className="text-on-dark hover:text-white transition-colors text-sm font-medium"
              data-ocid="header.about.link"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-on-dark hover:text-white transition-colors text-sm font-medium"
              data-ocid="header.contact.link"
            >
              Contact
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="text-on-dark hover:text-white transition-colors text-sm font-medium"
                data-ocid="header.dashboard.link"
              >
                My Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="text-on-dark hover:text-white transition-colors text-sm font-medium"
                data-ocid="header.admin.link"
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="tel:8332346343"
              className="flex items-center gap-1.5 bg-emergency hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
              data-ocid="header.emergency.button"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              833-234-6343
            </a>

            {isAuthenticated && <RoleBadge />}

            {isAuthenticated ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleLogout}
                className="text-white border-white/30 hover:bg-white/10 hover:text-white"
                data-ocid="header.logout.button"
              >
                <LogOut className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                Logout
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="bg-teal hover:bg-teal-light text-white border-0"
                data-ocid="header.login.button"
              >
                <LogIn className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                {isLoggingIn ? "Connecting..." : "Provider Login"}
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            data-ocid="header.mobile_menu.button"
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-white/10 pt-3 space-y-2">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-on-dark hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
              onClick={() => setMobileOpen(false)}
              data-ocid="header.mobile_find_care.link"
            >
              Find Care
            </Link>
            <a
              href="/helper"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm font-semibold"
              style={{ color: "oklch(0.80 0.12 196)" }}
              onClick={(e) => {
                handleHelperClick(e);
                setMobileOpen(false);
              }}
              data-ocid="header.mobile_helper.link"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Be a Helper
            </a>
            <Link
              to="/mission"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-on-dark hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
              onClick={() => setMobileOpen(false)}
              data-ocid="header.mobile_mission.link"
            >
              <Target className="h-4 w-4" aria-hidden="true" />
              Mission
            </Link>
            <Link
              to="/about"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-on-dark hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
              onClick={() => setMobileOpen(false)}
              data-ocid="header.mobile_about.link"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
              About
            </Link>
            <Link
              to="/contact"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-on-dark hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
              onClick={() => setMobileOpen(false)}
              data-ocid="header.mobile_contact.link"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Contact
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-on-dark hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
                onClick={() => setMobileOpen(false)}
                data-ocid="header.mobile_dashboard.link"
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                My Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-on-dark hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
                onClick={() => setMobileOpen(false)}
                data-ocid="header.mobile_admin.link"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Admin
              </Link>
            )}
            {isAuthenticated && (
              <div className="px-3 py-1">
                <RoleBadge className="text-xs" />
              </div>
            )}
            <a
              href="tel:8332346343"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emergency text-white font-bold text-sm"
              onClick={() => setMobileOpen(false)}
              data-ocid="header.mobile_emergency.button"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              EMERGENCY: 833-234-6343
            </a>
            <div className="px-3 pt-1">
              {isAuthenticated ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="w-full text-white border-white/30 hover:bg-white/10 hover:text-white"
                  data-ocid="header.mobile_logout.button"
                >
                  <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                  Logout
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    handleLogin();
                    setMobileOpen(false);
                  }}
                  disabled={isLoggingIn}
                  className="w-full bg-teal hover:bg-teal-light text-white border-0"
                  data-ocid="header.mobile_login.button"
                >
                  <LogIn className="h-4 w-4 mr-2" aria-hidden="true" />
                  {isLoggingIn ? "Connecting..." : "Provider Login"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
