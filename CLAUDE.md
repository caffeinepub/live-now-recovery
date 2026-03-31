# Live Now Recovery — Sovereign Stack Rules

This document defines the non-negotiable hard rules for all developers and AI agents working on this codebase.

---

## HARD RULE 1: NO-PHI POLICY

**No Protected Health Information (PHI) shall ever be stored, processed, or transmitted by any canister or service in this project.**

- Do NOT create fields for patient names, date of birth, social security numbers, diagnosis codes, prescription history, or any clinical records.
- The `Provider` type stores **logistics data only**: id, name, zip, isLive, lastVerified.
- The `SearchIntent` system stores **anonymous ZIP codes and timestamps only**. No user identifiers.
- Internet Identity is used for provider/admin authentication only. Patients are **never** asked to authenticate.
- If a feature requires PHI to function, do not build it. Escalate to the project owner.

---

## HARD RULE 2: 4-HOUR DECAY

**A provider's `isLive` status automatically expires if `lastVerified` is more than 4 hours old.**

- The Sentinel Agent heartbeat runs every 5 minutes.
- Any provider where `Time.now() - lastVerified > 14_400_000_000_000` (4 hours in nanoseconds) will have `isLive` set to `false` automatically.
- This decay cannot be disabled or bypassed by any user or admin action.
- The 4-hour window is intentional: it forces providers to actively confirm their availability, reducing stale/inaccurate listings.
- Frontend code must reflect this rule: the `isProviderStale` utility must use a 4-hour threshold (not 24 hours or any other value).

---

## Architecture Constraints

- **Stack**: Motoko (backend canister on ICP) + React/Tailwind/TypeScript (frontend)
- **Authentication**: Internet Identity only — no third-party OAuth, no passwords
- **Data scope**: Provider logistics only (name, zip, live status, verification timestamp)
- **Emergency Mode**: Activates automatically after 5 PM or on weekends (Ohio/Eastern time)
- **No payments**: No payment processing, no billing data, no financial records stored
- **No ride processing**: Ride-request features use deep links to Uber/Lyft only — no API integrations

---

*Built by a peer 8-years clean. Your data is never stored. You are not alone.*
