# Live Now Recovery — Impact Shadow Visualization

## Current State
The app has a Leaflet map (`ProviderMap.tsx`) with provider pins and helper ZIP coverage circles. The backend tracks `searchVolume` per ZIP and has `getLiveHelpers(zip)`. No impact visualization or predictive pulse exists yet.

## Requested Changes (Diff)

### Add
- Backend: `getImpactData(zip)` — returns `{ savingsPot: Float; livesProjected: Float; helperCount: Nat; searchIntents: Nat }`. savingsPot = searchIntents * 120. livesProjected = (seededPop/500) * 0.088.
- Backend: `getAllZipImpactData()` — returns array of all ZIP impact records for map overlay.
- Frontend: `ShadowLayer` component embedded in `ProviderMap.tsx` — seafoam green glow circles over NE Ohio ZIPs, radius = searchIntents * 5 (min 400m), CSS pulsing animation tied to risk level.
- Frontend: `ShadowTooltip` popup on circle click — "Community Wealth Reclaimed", "Safety Coverage", "Active Peer Bridge" lines.
- Frontend: "Show Impact" toggle button on the map.
- Frontend: `useAllZipImpactData` and `useZipImpactData` hooks in `useQueries.ts`.
- CSS: `.shadow-pulse-calm` (4s) and `.shadow-pulse-rush` (0.8s) animation classes.
- Rush trigger: ZIP auto-flags as high-urgency when searchIntents > 20 (frontend-side threshold using fetched data).

### Modify
- `ProviderMap.tsx` — add ShadowLayer render and toggle state, accept `impactData` and `systemRiskLevel` props.
- `HomePage.tsx` — pass `impactData` and `systemRiskLevel` to ProviderMap.
- `backend.d.ts` — add `ImpactData` interface and new method signatures.
- `useQueries.ts` — add impact data hooks.

### Remove
- Nothing removed.

## Implementation Plan
1. Add `getImpactData` and `getAllZipImpactData` to Motoko backend with seeded ZIP population map.
2. Update `backend.d.ts` with `ImpactData` type and two new method signatures.
3. Add `useAllZipImpactData` hook to `useQueries.ts` with 30s refetch.
4. Add CSS pulse animations to `index.css`.
5. Build `ShadowLayer` logic inside `ProviderMap.tsx` — render seafoam circles per ZIP, show tooltip on click.
6. Add "Show Impact" toggle button on the map.
7. Wire `systemRiskLevel` prop to control animation speed (calm vs rush).
8. Update `HomePage.tsx` to pass impact data and risk level to map.
