import { Html } from "@react-three/drei";
import { ModuleManifest, SpatialVolume } from "../sdk/types";
import { useState, useEffect } from "react";
import { useAgentStore } from "../store/useAgentStore";

export const clockManifest: ModuleManifest = {
  id: "core.clock",
  name: "Spatial Clock",
  purpose: "A simple wall clock.",
  version: "0.1.0",
  capabilities: [],
  surface: "projected",
  defaultAnchor: "wall",
};

export function ClockModule({
  volume,
  instanceId,
  instance,
}: {
  volume: SpatialVolume;
  instanceId: string;
  instance: any;
}) {
  const [time, setTime] = useState(new Date());
  const updateInstanceData = useAgentStore((state) => state.updateInstanceData);
  
  const timerRemaining = instance?.data?.timerRemaining ?? 0;
  const timezoneName = instance?.data?.timezoneName ?? "Local";

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
      if (timerRemaining > 0) {
        updateInstanceData(instanceId, { timerRemaining: timerRemaining - 1 });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRemaining, instanceId, updateInstanceData]);

  // Try to generate string matching desired timezone (e.g. UTC, PST, or America/New_York)
  let finalTimeString = "";
  let finalDateString = "";
  
  try {
    const options: Intl.DateTimeFormatOptions = { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" };
    if (timezoneName !== "Local") {
      options.timeZone = timezoneName;
    }
    finalTimeString = time.toLocaleTimeString([], options);
    
    const dateOptions: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric", year: "numeric" };
    if (timezoneName !== "Local") {
      dateOptions.timeZone = timezoneName;
    }
    finalDateString = time.toLocaleDateString([], dateOptions);
  } catch (err) {
    // Fallback if timezone code is invalid
    finalTimeString = time.toLocaleTimeString([], { hour12: false });
    finalDateString = time.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <group
      position={volume.position}
      rotation={volume.rotation}
      scale={volume.scale}
    >
      <Html
        transform
        occlude
        wrapperClass="pointer-events-none"
        distanceFactor={3}
      >
        <div className="flex flex-col items-center justify-center p-8 bg-black/80 backdrop-blur-md border border-amber-500/30 rounded-sm shadow-[0_0_30px_rgba(245,158,11,0.2)] min-w-[320px]">
          <div className="absolute top-2 left-2 text-[8px] text-amber-500/50 uppercase tracking-widest font-mono">
            SYS_TIME [{timezoneName}]
          </div>
          
          <div className="text-6xl font-mono tracking-widest text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)] font-bold">
            {finalTimeString}
          </div>
          
          <div className="mt-2 text-xs text-amber-200/80 tracking-[0.2em] uppercase font-mono">
            {finalDateString}
          </div>

          {timerRemaining > 0 ? (
            <div className="mt-4 w-full border-t border-amber-500/20 pt-3 flex flex-col items-center justify-center">
              <span className="text-[8px] text-rose-500 font-mono tracking-widest uppercase animate-pulse">
                [!] ACTIVE COUNTDOWN TIMER
              </span>
              <span className="text-2xl font-mono text-rose-400 font-bold tracking-widest drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                {Math.floor(timerRemaining / 60).toString().padStart(2, "0")}:
                {(timerRemaining % 60).toString().padStart(2, "0")}
              </span>
            </div>
          ) : instance?.data?.timerRemaining === 0 ? (
            <div className="mt-4 w-full border-t border-amber-500/20 pt-3 flex flex-col items-center justify-center animate-bounce">
              <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase font-bold">
                [!] TIMER COMPLETE [!]
              </span>
            </div>
          ) : null}
        </div>
      </Html>
    </group>
  );
}
