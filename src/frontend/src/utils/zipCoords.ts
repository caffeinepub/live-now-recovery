export const ZIP_COORDS: Record<string, { lat: number; lng: number }> = {
  "44101": { lat: 41.4993, lng: -81.6944 },
  "44102": { lat: 41.482, lng: -81.7411 },
  "44103": { lat: 41.5141, lng: -81.6519 },
  "44104": { lat: 41.4826, lng: -81.6341 },
  "44105": { lat: 41.4616, lng: -81.6603 },
  "44106": { lat: 41.5068, lng: -81.6076 },
  "44107": { lat: 41.4825, lng: -81.7334 },
  "44108": { lat: 41.5363, lng: -81.6235 },
  "44109": { lat: 41.4608, lng: -81.7083 },
  "44110": { lat: 41.552, lng: -81.5811 },
  "44111": { lat: 41.4821, lng: -81.7783 },
  "44112": { lat: 41.5258, lng: -81.598 },
  "44113": { lat: 41.4878, lng: -81.7012 },
  "44114": { lat: 41.5122, lng: -81.6737 },
  "44115": { lat: 41.5033, lng: -81.6848 },
  "44120": { lat: 41.4756, lng: -81.5896 },
  "44128": { lat: 41.437, lng: -81.543 },
  "44130": { lat: 41.4271, lng: -81.7358 },
  "44135": { lat: 41.4362, lng: -81.8008 },
  "44139": { lat: 41.3842, lng: -81.5218 },
  "44143": { lat: 41.5738, lng: -81.5161 },
  "44146": { lat: 41.4006, lng: -81.53 },
};

// Fallback: Cleveland city center
export const CLEVELAND_CENTER = { lat: 41.4993, lng: -81.6944 };

export function getZipCoords(zip: string): { lat: number; lng: number } {
  return ZIP_COORDS[zip] ?? CLEVELAND_CENTER;
}
