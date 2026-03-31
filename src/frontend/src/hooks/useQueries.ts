import type { AuditLogEntry, ProviderInput } from "@/backend.d";
import {
  type ProviderWithCoords,
  SAMPLE_PROVIDERS,
} from "@/constants/providers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

// Coordinate grid for Ohio Region 13 providers
// Spreads providers across the Cleveland metro area
const COORD_GRID = [
  { lat: 41.4993, lng: -81.6944 }, // Cleveland
  { lat: 41.4823, lng: -81.7998 }, // Lakewood
  { lat: 41.3845, lng: -81.729 }, // Parma
  { lat: 41.5931, lng: -81.5268 }, // Euclid
  { lat: 41.6661, lng: -81.3395 }, // Mentor
  { lat: 41.7245, lng: -81.2459 }, // Painesville
  { lat: 41.4548, lng: -81.8318 }, // Berea
  { lat: 41.3928, lng: -81.8543 }, // Strongsville
  { lat: 41.5236, lng: -81.9568 }, // Avon
  { lat: 41.4554, lng: -82.0074 }, // Avon Lake
  { lat: 41.3862, lng: -82.1082 }, // Oberlin
  { lat: 41.6187, lng: -81.4268 }, // Willoughby
  { lat: 41.5151, lng: -81.4401 }, // Highland Heights
  { lat: 41.4879, lng: -81.519 }, // Cleveland Heights
  { lat: 41.4748, lng: -81.5615 }, // University Circle area
  { lat: 41.4014, lng: -81.6696 }, // Brooklyn
  { lat: 41.4326, lng: -81.6549 }, // Garfield Heights
];

// Local type — mirrors ContactMessage in backend.d.ts
// (not yet in the auto-generated backend.ts so we declare it here)
export interface ContactMessage {
  id: string;
  name: string;
  organization: string;
  message: string;
  timestamp: bigint;
}

function assignCoords(index: number) {
  const grid = COORD_GRID[index % COORD_GRID.length];
  // Small jitter so overlapping pins are slightly offset
  const jitter =
    index >= COORD_GRID.length ? (index - COORD_GRID.length) * 0.008 : 0;
  return { lat: grid.lat + jitter, lng: grid.lng + jitter };
}

export function useProviders() {
  const { actor, isFetching } = useActor();
  return useQuery<ProviderWithCoords[]>({
    queryKey: ["providers"],
    queryFn: async () => {
      if (!actor) return SAMPLE_PROVIDERS;
      try {
        // getActiveProviders is public — returns only live + verified providers
        const providers = await actor.getActiveProviders();
        if (providers.length === 0) return SAMPLE_PROVIDERS;
        return providers.map((p, i) => ({
          ...p,
          ...assignCoords(i),
        }));
      } catch {
        return SAMPLE_PROVIDERS;
      }
    },
    enabled: !isFetching,
  });
}

export function useProviderById(id: string) {
  const { actor, isFetching } = useActor();
  return useQuery<ProviderWithCoords | null>({
    queryKey: ["provider", id],
    queryFn: async () => {
      const sample = SAMPLE_PROVIDERS.find((p) => p.id === id);
      if (!actor) return sample ?? null;
      try {
        const provider = await actor.getProvider(id);
        return {
          ...provider,
          lat: sample?.lat ?? 41.4993,
          lng: sample?.lng ?? -81.6944,
        };
      } catch {
        return sample ?? null;
      }
    },
    enabled: !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !isFetching,
  });
}

export function useProviderDashboard() {
  const { actor, isFetching } = useActor();
  return useQuery<ProviderWithCoords | null>({
    queryKey: ["providerDashboard"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const p = await actor.getProviderByPrincipal();
        if (!p) return null;
        return { ...p, lat: 41.4993, lng: -81.6944 };
      } catch {
        return null;
      }
    },
    enabled: !isFetching,
  });
}

export function useAllProvidersAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<ProviderWithCoords[]>({
    queryKey: ["allProviders"],
    queryFn: async () => {
      if (!actor) return SAMPLE_PROVIDERS;
      try {
        // Admin-only: getProviders returns all providers regardless of status
        const providers = await actor.getProviders();
        return providers.map((p, i) => ({
          ...p,
          ...assignCoords(i),
        }));
      } catch {
        return SAMPLE_PROVIDERS;
      }
    },
    enabled: !isFetching,
  });
}

export function useToggleLiveStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected to backend");
      return actor.toggleLiveStatus(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providerDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
  });
}

export function useAddProvider() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProviderInput) => {
      if (!actor) throw new Error("Not connected to backend");
      return actor.addProvider(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providerDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
  });
}

export function useVerifyProvider() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      if (!actor) throw new Error("Not connected to backend");
      return actor.verifyProvider(id, verified);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allProviders"] });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
  });
}

// Sentinel Agent hooks
export function useSystemRiskLevel() {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ["systemRiskLevel"],
    queryFn: async () => {
      if (!actor) return "GREEN";
      try {
        return await (actor as any).getSystemRiskLevel();
      } catch {
        return "GREEN";
      }
    },
    enabled: !isFetching,
    refetchInterval: 60_000,
  });
}

export function useRecordSearchIntent() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (zip: string) => {
      if (!actor || !zip.trim()) return;
      try {
        await (actor as any).recordSearchIntent(zip.trim());
      } catch {
        // fire-and-forget: silently ignore errors
      }
    },
  });
}

// ── Proof of Presence (PoP) hooks ──────────────────────────────────────────

export function useRequestHandoff() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (zip: string): Promise<string> => {
      if (!actor) throw new Error("Not connected to backend");
      return (actor as any).requestHandoff(zip);
    },
  });
}

export function useCompleteHandoff() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (
      token: string,
    ): Promise<{ ok: null } | { err: string }> => {
      if (!actor) throw new Error("Not connected to backend");
      return (actor as any).completeHandoff(token);
    },
  });
}

export function useHandoffStats() {
  const { actor, isFetching } = useActor();
  return useQuery<{ total: bigint; recent: bigint }>({
    queryKey: ["handoffStats"],
    queryFn: async () => {
      if (!actor) return { total: BigInt(0), recent: BigInt(0) };
      try {
        return await (actor as any).getHandoffStats();
      } catch {
        return { total: BigInt(0), recent: BigInt(0) };
      }
    },
    enabled: !isFetching,
    refetchInterval: 10_000,
  });
}

export function useRecentHandoffs(since: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["recentHandoffs", since.toString()],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await (actor as any).getRecentHandoffs(since);
      } catch {
        return [];
      }
    },
    enabled: !isFetching,
    refetchInterval: 5_000,
  });
}

// ── Contact Messages (admin-only) ──────────────────────────────────────────

export function useContactMessages() {
  const { actor, isFetching } = useActor();
  return useQuery<ContactMessage[]>({
    queryKey: ["contactMessages"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await (actor as any).getContactMessages();
      } catch {
        return [];
      }
    },
    enabled: !isFetching,
  });
}

// ── Community Helper hooks ──────────────────────────────────────────────────

export function useHelperStatus() {
  const { actor, isFetching } = useActor();
  return useQuery<import("@/backend.d").Helper | null>({
    queryKey: ["helperStatus"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const result = await (actor as any).getHelperStatus();
        // Motoko returns opt Helper as [] | [Helper]
        if (Array.isArray(result)) return result[0] ?? null;
        return result ?? null;
      } catch {
        return null;
      }
    },
    enabled: !isFetching,
    refetchInterval: 30_000,
  });
}

export function useClaimArea() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (zip: string) => {
      if (!actor) throw new Error("Not connected to backend");
      return (actor as any).claimArea(zip);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["helperStatus"] });
      queryClient.invalidateQueries({ queryKey: ["activeHelperZips"] });
    },
  });
}

export function useCheckOutArea() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected to backend");
      return (actor as any).checkOutArea();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["helperStatus"] });
      queryClient.invalidateQueries({ queryKey: ["activeHelperZips"] });
    },
  });
}

export function useLiveHelpers(zip: string) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["liveHelpers", zip],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      try {
        return await (actor as any).getLiveHelpers(zip);
      } catch {
        return BigInt(0);
      }
    },
    enabled: !!zip && !isFetching,
  });
}

export function useHighRiskAreas() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["highRiskAreas"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await (actor as any).getHighRiskAreas();
      } catch {
        return [];
      }
    },
    enabled: !isFetching,
  });
}

export function useActiveHelperZips() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["activeHelperZips"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await (actor as any).getActiveHelperZips();
      } catch {
        return [];
      }
    },
    enabled: !isFetching,
    refetchInterval: 30_000,
  });
}

// ── Twilio SMS hooks ────────────────────────────────────────────────────────

export function useTwilioConfigured() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["twilioConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await (actor as any).getTwilioConfigured();
      } catch {
        return false;
      }
    },
    enabled: !isFetching,
  });
}

export function useUpdateTwilioConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sid,
      authToken,
      fromNumber,
    }: {
      sid: string;
      authToken: string;
      fromNumber: string;
    }) => {
      if (!actor) throw new Error("Not connected to backend");
      return (actor as any).updateTwilioConfig(sid, authToken, fromNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["twilioConfigured"] });
    },
  });
}

export function useSendVerificationSMS() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      targetPhone,
      callerZip,
    }: {
      targetPhone: string;
      callerZip: string;
    }): Promise<string> => {
      if (!actor) throw new Error("Not connected to backend");
      return (actor as any).sendVerificationSMS(targetPhone, callerZip);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smsAuditLog"] });
    },
  });
}

export function useSmsAuditLog() {
  const { actor, isFetching } = useActor();
  return useQuery<AuditLogEntry[]>({
    queryKey: ["smsAuditLog"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await (actor as any).getSmsAuditLog();
      } catch {
        return [];
      }
    },
    enabled: !isFetching,
  });
}

// ── RBAC Registry hooks ────────────────────────────────────────────────────

export function useAllRegisteredUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<import("@/backend.d").RegistryEntry[]>({
    queryKey: ["allRegisteredUsers"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await (actor as any).getAllRegisteredUsers();
      } catch {
        return [];
      }
    },
    enabled: !isFetching,
  });
}

export function useClinicStatus(providerId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<import("@/backend.d").ClinicStatus | null>({
    queryKey: ["clinicStatus", providerId],
    queryFn: async () => {
      if (!actor || !providerId) return null;
      try {
        const result = await (actor as any).getClinicStatus(providerId);
        if (Array.isArray(result)) return result[0] ?? null;
        return result ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!providerId && !isFetching,
  });
}

export function useUpdateClinicStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      naloxone,
      acceptingPatients,
    }: {
      naloxone: import("@/backend.d").NaloxoneStock;
      acceptingPatients: boolean;
    }) => {
      if (!actor) throw new Error("Not connected to backend");
      return (actor as any).updateClinicStatus(naloxone, acceptingPatients);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinicStatus"] });
    },
  });
}

export function useAllZipImpactData() {
  const { actor, isFetching } = useActor();
  return useQuery<import("@/backend.d").ImpactData[]>({
    queryKey: ["allZipImpactData"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await (actor as any).getAllZipImpactData();
      } catch {
        return [];
      }
    },
    enabled: !isFetching,
    refetchInterval: 30_000,
  });
}
