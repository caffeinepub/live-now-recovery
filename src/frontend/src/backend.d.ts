import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Provider {
    id: string;
    zip: string;
    name: string;
    isLive: boolean;
    lastVerified: bigint;
    isVerified: boolean;
    address: string;
    phone: string;
}
export interface UserProfile {
    name: string;
}
export interface ProviderInput {
    zip: string;
    name: string;
    address: string;
    phone: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}

// Proof of Presence — Handoff System
export type HandoffStatus = { Pending: null } | { Completed: null };
export interface Handoff {
    id: string;
    volHash: string;
    zip: string;
    timestamp: bigint;
    status: HandoffStatus;
}
export interface HandoffStats {
    total: bigint;
    recent: bigint;
}
export type CompleteHandoffResult = { ok: null } | { err: string };

// Contact Messages
export interface ContactMessage {
    id: string;
    name: string;
    organization: string;
    message: string;
    timestamp: bigint;
}

// Community Helper (NO-PHI: id is hash of principal)
export type HelperStatus = { Active: null } | { Offline: null };
export interface Helper {
    id: string;
    status: HelperStatus;
    assignedZip: string;
    lastCheckIn: bigint;
}

// Twilio SMS Config
export interface AuditLogEntry {
    timestamp: bigint;
    zip: string;
    outcome: string;
}

// RBAC
export type AppUserRole = { User: null } | { Helper: null } | { Clinic: null } | { Admin: null };
export interface RoleProfile {
    alias: string;
    zip: string;
    role: AppUserRole;
    registeredAt: bigint;
}
export interface RegistryEntry {
    hashedId: string;
    role: string;
}

// Clinic status
export type NaloxoneStock = { Available: null } | { LimitedStock: null } | { OutOfStock: null };
export interface ClinicStatus {
    naloxone: NaloxoneStock;
    acceptingPatients: boolean;
    updatedAt: bigint;
}


export interface ImpactData {
    zip: string;
    savingsPot: number;
    livesProjected: number;
    helperCount: bigint;
    searchIntents: bigint;
}

export interface backendInterface {
    addProvider(input: ProviderInput): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getActiveProviders(): Promise<Array<Provider>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getProvider(id: string): Promise<Provider>;
    getProviderByPrincipal(): Promise<Provider | null>;
    getProviders(): Promise<Array<Provider>>;
    getSystemRiskLevel(): Promise<string>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    recordSearchIntent(zip: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    toggleLiveStatus(id: string): Promise<void>;
    verifyProvider(id: string, verified: boolean): Promise<void>;
    // Proof of Presence
    requestHandoff(zip: string): Promise<string>;
    completeHandoff(token: string): Promise<CompleteHandoffResult>;
    getHandoffStatus(token: string): Promise<Handoff | null>;
    getHandoffStats(): Promise<HandoffStats>;
    getRecentHandoffs(since: bigint): Promise<Array<Handoff>>;
    // Contact Messages
    submitContactMessage(name: string, organization: string, message: string): Promise<void>;
    getContactMessages(): Promise<Array<ContactMessage>>;
    // Community Helpers
    claimArea(zip: string): Promise<void>;
    checkOutArea(): Promise<void>;
    getLiveHelpers(zip: string): Promise<bigint>;
    getHelperStatus(): Promise<Helper | null>;
    getHighRiskAreas(): Promise<Array<string>>;
    getActiveHelperZips(): Promise<Array<string>>;
    // Twilio SMS
    updateTwilioConfig(sid: string, authToken: string, fromNumber: string): Promise<void>;
    getTwilioConfigured(): Promise<boolean>;
    sendVerificationSMS(targetPhone: string, callerZip: string): Promise<string>;
    getSmsAuditLog(): Promise<Array<AuditLogEntry>>;
    // RBAC Registry
    registerRole(role: AppUserRole, alias: string, zip: string): Promise<void>;
    getMyRole(): Promise<AppUserRole | null>;
    getMyRoleProfile(): Promise<RoleProfile | null>;
    getAllRegisteredUsers(): Promise<Array<RegistryEntry>>;
    // Clinic
    updateClinicStatus(naloxone: NaloxoneStock, acceptingPatients: boolean): Promise<void>;
    getClinicStatus(providerId: string): Promise<ClinicStatus | null>;
    // Impact Shadow
    getImpactData(zip: string): Promise<ImpactData>;
    getAllZipImpactData(): Promise<Array<ImpactData>>;
}
