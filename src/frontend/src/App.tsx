import EmergencyBanner from "@/components/EmergencyBanner";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SentinelChat from "@/components/SentinelChat";
import { Toaster } from "@/components/ui/sonner";
import AboutPage from "@/pages/AboutPage";
import AdminPage from "@/pages/AdminPage";
import BlogPage from "@/pages/BlogPage";
import BlogPostPage from "@/pages/BlogPostPage";
import ContactPage from "@/pages/ContactPage";
import DashboardPage from "@/pages/DashboardPage";
import FounderPage from "@/pages/FounderPage";
import HelperPage from "@/pages/HelperPage";
import HomePage from "@/pages/HomePage";
import LocationPage, { LocationPageDirect } from "@/pages/LocationPage";
import MissionPage from "@/pages/MissionPage";
import ProviderPage from "@/pages/ProviderPage";
import RegisterPage from "@/pages/RegisterPage";
import VerifyPage from "@/pages/VerifyPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen flex flex-col bg-background">
      <EmergencyBanner />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toaster richColors position="top-right" />
      <SentinelChat />
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const providerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/provider/$id",
  component: ProviderPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const helperRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/helper",
  component: HelperPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const verifyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify",
  component: VerifyPage,
});

const missionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/mission",
  component: MissionPage,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contact",
  component: ContactPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const founderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/founder",
  component: FounderPage,
});

const blogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blog",
  component: BlogPage,
});

const blogPostRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blog/$slug",
  component: BlogPostPage,
});

const locationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/location/$town",
  component: LocationPage,
});

// Direct SEO town routes
const clevelandRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cleveland",
  component: () => <LocationPageDirect town="cleveland" />,
});

const lakewoodRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/lakewood",
  component: () => <LocationPageDirect town="lakewood" />,
});

const parmaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/parma",
  component: () => <LocationPageDirect town="parma" />,
});

const lorainRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/lorain",
  component: () => <LocationPageDirect town="lorain" />,
});

const akronRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/akron",
  component: () => <LocationPageDirect town="akron" />,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  providerRoute,
  dashboardRoute,
  helperRoute,
  adminRoute,
  verifyRoute,
  missionRoute,
  aboutRoute,
  contactRoute,
  registerRoute,
  founderRoute,
  blogRoute,
  blogPostRoute,
  locationRoute,
  clevelandRoute,
  lakewoodRoute,
  parmaRoute,
  lorainRoute,
  akronRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
