# Live Now Recovery

## Current State
The app has: HomePage, ProviderPage, DashboardPage, AdminPage, VerifyPage. Header has Find Care, Dashboard, Admin nav links. Footer has resources and emergency CTA. Backend has provider management, Sentinel Agent, PoP handoff system.

## Requested Changes (Diff)

### Add
- `/mission` page: Mission statement, Why We Built This problem/solution table, Hard Rules (No-PHI, 4-Hour Decay, Transparency Mandate, PoP as Primary Metric)
- `/about` page: Who It Serves (5 audiences), How It Works flow, Where It Is Going roadmap (Near/Mid/Long-term)
- `/contact` page: Form with name, organization, message fields stored in backend canister
- `submitContactMessage(name, org, message)` backend function — stores anonymous contact submissions
- `getContactMessages()` admin-only backend query — returns all submissions for admin review
- Admin dashboard section to view contact messages
- Header nav links for Mission, About, Contact (desktop + mobile)

### Modify
- Header: add Mission, About, Contact nav links
- AdminPage: add Contact Messages tab/section
- Backend main.mo: add ContactMessage type and functions

### Remove
- Nothing removed

## Implementation Plan
1. Update backend (main.mo) with ContactMessage type, submitContactMessage, getContactMessages
2. Regenerate backend.d.ts bindings
3. Create MissionPage.tsx using README content
4. Create AboutPage.tsx using README content
5. Create ContactPage.tsx with form wired to submitContactMessage
6. Update App.tsx with /mission, /about, /contact routes
7. Update Header.tsx with new nav links
8. Update AdminPage.tsx with contact messages section
