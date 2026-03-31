import type { AppUserRole } from "@/backend.d";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function isUserRole(r: AppUserRole | null | undefined): boolean {
  return !!r && "User" in r;
}

export function isHelperRole(r: AppUserRole | null | undefined): boolean {
  return !!r && "Helper" in r;
}

export function isClinicRole(r: AppUserRole | null | undefined): boolean {
  return !!r && "Clinic" in r;
}

export function isAdminRole(r: AppUserRole | null | undefined): boolean {
  return !!r && "Admin" in r;
}

export function roleLabel(r: AppUserRole | null | undefined): string {
  if (!r) return "";
  if ("User" in r) return "Member";
  if ("Helper" in r) return "Helper";
  if ("Clinic" in r) return "Clinic";
  if ("Admin" in r) return "Admin";
  return "";
}

export function useRole() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const query = useQuery<AppUserRole | null>({
    queryKey: ["myRole"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const result = await (actor as any).getMyRole();
        // Motoko returns opt as [] | [value]
        if (Array.isArray(result)) return result[0] ?? null;
        return result ?? null;
      } catch {
        return null;
      }
    },
    enabled: isAuthenticated && !!actor && !isFetching,
    staleTime: 60_000,
  });

  return {
    role: query.data,
    isLoading: query.isLoading || isFetching,
    refetch: query.refetch,
  };
}

export function useRefetchRole() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["myRole"] });
}
