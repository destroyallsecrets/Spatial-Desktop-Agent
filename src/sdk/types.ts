export type AnchorMode = "floating" | "wall" | "desk" | "hand";
export type SurfaceType = "projected" | "volumetric";

export interface CapabilityRequest {
  name: string;
  scope?: string;
}

export interface ModuleManifest {
  id: string;
  name: string;
  purpose: string;
  version: string;
  capabilities: CapabilityRequest[];
  surface: SurfaceType;
  defaultAnchor: AnchorMode;
}

export interface SpatialVolume {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface ModuleInstance {
  id: string;
  manifest: ModuleManifest;
  volume: SpatialVolume;
  data?: Record<string, any>;
}
