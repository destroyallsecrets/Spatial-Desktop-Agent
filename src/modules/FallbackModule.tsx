import { Html } from "@react-three/drei";
import { SpatialVolume } from "../sdk/types";

export function FallbackModule({
  volume,
  manifest,
}: {
  volume: SpatialVolume;
  manifest: any;
}) {
  return (
    <group
      position={volume.position}
      rotation={volume.rotation}
      scale={volume.scale}
    >
      <mesh receiveShadow castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#8b5cf6"
          roughness={0.3}
          metalness={0.8}
          opacity={0.8}
          transparent
        />
      </mesh>

      <Html center position={[0, 0.6, 0]}>
        <div className="bg-black/80 px-3 py-1 rounded border border-purple-500/50 text-xs font-mono text-purple-300 whitespace-nowrap shadow-lg backdrop-blur-sm">
          {manifest.id}
        </div>
      </Html>
    </group>
  );
}
