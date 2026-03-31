// Type stubs for leaflet / react-leaflet.
// These packages are loaded via CDN at runtime; the stubs satisfy TypeScript
// without requiring entries in the locked package.json.

declare module "leaflet" {
  interface DivIconOptions {
    className?: string;
    html?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
    popupAnchor?: [number, number];
  }
  interface Icon {}
  interface DivIcon extends Icon {}
  function divIcon(options: DivIconOptions): DivIcon;

  const L: {
    divIcon: typeof divIcon;
  };
  export default L;
  export { divIcon };
}

declare module "react-leaflet" {
  import type { ReactNode, CSSProperties } from "react";

  interface MapContainerProps {
    center: [number, number];
    zoom: number;
    style?: CSSProperties;
    scrollWheelZoom?: boolean;
    children?: ReactNode;
  }
  export function MapContainer(props: MapContainerProps): JSX.Element;

  interface TileLayerProps {
    attribution?: string;
    url: string;
  }
  export function TileLayer(props: TileLayerProps): JSX.Element;

  interface MarkerProps {
    position: [number, number];
    icon?: import("leaflet").Icon | import("leaflet").DivIcon;
    eventHandlers?: Record<string, (...args: unknown[]) => void>;
    children?: ReactNode;
  }
  export function Marker(props: MarkerProps): JSX.Element;

  interface PopupProps {
    children?: ReactNode;
  }
  export function Popup(props: PopupProps): JSX.Element;
}

declare module "leaflet/dist/leaflet.css" {}
