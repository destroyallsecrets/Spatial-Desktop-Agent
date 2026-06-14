import { Html } from "@react-three/drei";
import { ModuleManifest, SpatialVolume } from "../sdk/types";
import { useAgentStore } from "../store/useAgentStore";

export const notesManifest: ModuleManifest = {
  id: "core.notes",
  name: "Spatial Notes",
  purpose: "A floating text editor and scratchpad.",
  version: "0.1.0",
  capabilities: [],
  surface: "projected",
  defaultAnchor: "wall",
};

export function NotesModule({
  volume,
  instanceId,
  instance,
}: {
  volume: SpatialVolume;
  instanceId: string;
  instance: any;
}) {
  const updateInstanceData = useAgentStore((state) => state.updateInstanceData);
  const content = instance?.data?.text ?? "";

  const handleChange = (newVal: string) => {
    updateInstanceData(instanceId, { text: newVal });
  };

  return (
    <group
      position={volume.position}
      rotation={volume.rotation}
      scale={volume.scale}
    >
      <Html
        transform
        occlude
        wrapperClass="pointer-events-auto"
        distanceFactor={2}
      >
        <div className="w-[350px] h-[450px] bg-black/90 border border-fuchsia-500/40 rounded-sm flex flex-col shadow-[0_0_20px_rgba(217,70,239,0.2)] overflow-hidden cursor-default transition-all duration-300">
          {/* Header */}
          <div className="bg-[#02050a]/80 p-3 border-b border-fuchsia-500/40 flex justify-between items-center backdrop-blur-sm">
            <span className="text-[10px] text-fuchsia-400 font-bold tracking-widest uppercase font-mono shadow-fuchsia-500/50">
              Local_Buffer
            </span>
            <span className="text-[8px] text-fuchsia-500/50 font-mono uppercase font-bold tracking-widest leading-[1]">
              Live_Linked
            </span>
          </div>

          {/* Text Area */}
          <textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            className="flex-1 p-4 bg-transparent outline-none text-xs text-fuchsia-100 placeholder-fuchsia-900/50 resize-none font-mono leading-relaxed"
            placeholder="Initialize buffer..."
          />
        </div>
      </Html>
    </group>
  );
}
