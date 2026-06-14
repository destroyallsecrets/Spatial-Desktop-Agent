import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Player } from "./components/Player";
import { WorldEnvironment } from "./components/Environment";
import { ModuleHost } from "./components/ModuleHost";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useState, useEffect } from "react";
import * as THREE from "three";

export default function App() {
  const [locked, setLocked] = useState(false);
  const [started, setStarted] = useState(false);
  const [timeStr, setTimeStr] = useState("");

  const handleLock = () => {
    setLocked(true);
    setStarted(true);
  };

  useEffect(() => {
    const updateTime = () =>
      setTimeStr(new Date().toLocaleTimeString("en-US", { hour12: false }));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-screen bg-[#050506] text-[#e0e0e0] font-mono flex flex-col relative overflow-hidden select-none">
      {/* Background 3D Grid Perspective */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(32,107,255,0.1),transparent_70%)]"></div>
        {!locked && (
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(rgba(32,107,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(32,107,255,0.05) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              transform: "perspective(500px) rotateX(60deg) translateY(-100px)",
            }}
          />
        )}
      </div>

      {/* 3D Viewport - Takes full screen, absolute behind UI */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ fov: 75 }}>
          <Physics gravity={[0, -15, 0]}>
            <Player onLock={handleLock} onUnlock={() => setLocked(false)} />
            <WorldEnvironment />
          </Physics>
          <ModuleHost />

          <EffectComposer>
            <Bloom
              luminanceThreshold={1.0} // only bloom extremely bright things natively, OR use 0 to bloom everything
              mipmapBlur={true}
              intensity={1.5}
              resolutionScale={1.0}
            />
            <ChromaticAberration
              offset={new THREE.Vector2(0.002, 0.002)}
              blendFunction={BlendFunction.NORMAL} // Added blendFunction
            />
          </EffectComposer>
        </Canvas>
      </div>

      {/* Top HUD: System Status */}
      <div className="z-10 flex justify-between p-6 border-b border-emerald-500/20 bg-black/60 backdrop-blur-md pointer-events-none drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]">
        <div className="flex items-center space-x-4">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
          <span className="text-xs tracking-widest uppercase font-bold text-emerald-400 font-mono drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">
            Movement_Kernel_Loaded
          </span>
        </div>
        <div className="flex space-x-8 text-[10px] tracking-widest uppercase text-emerald-500/50 font-mono mb-[-2px]">
          <div>
            FPS: <span className="text-emerald-400">144.0</span>
          </div>
          <div>
            Lat: <span className="text-emerald-400">0.02ms</span>
          </div>
          <div>
            Phys_Step: <span className="text-emerald-400">0.016s</span>
          </div>
        </div>
      </div>

      {/* Main Viewport Area (HUD Overlays) */}
      <div className="flex-1 relative flex items-center justify-center pointer-events-none">
        {/* Crosshair Removed */}

        {/* Left Overlay: Controller Parameters */}
        <div
          className={`absolute left-8 top-12 space-y-6 transition-all duration-500 ${locked ? "opacity-100 translate-x-0" : "opacity-20 -translate-x-4"}`}
        >
          <div className="p-4 bg-black/80 border-l-2 border-cyan-500 w-64 backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <h3 className="text-[10px] text-cyan-400 uppercase mb-3 font-bold tracking-wider">
              Kinematic State
            </h3>
            <div className="space-y-2 font-mono">
              <div className="flex justify-between text-xs">
                <span className="text-cyan-500/50">Velocity</span>
                <span className="text-cyan-100">0.00 m/s</span>
              </div>
              <div className="w-full h-1 bg-cyan-900/40 mt-1 mb-2">
                <div className="h-full bg-cyan-500 w-0 shadow-[0_0_5px_rgba(6,182,212,0.8)]"></div>
              </div>
              <div className="flex justify-between text-xs pt-2">
                <span className="text-cyan-500/50">Posture</span>
                <span className="text-cyan-300 font-bold">
                  {locked ? "Tracking" : "Idle"}
                </span>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span className="text-cyan-500/50">Stance</span>
                <span className="text-cyan-300">Neutral</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-black/80 border-l-2 border-emerald-500/40 w-64 backdrop-blur-sm">
            <h3 className="text-[10px] text-emerald-500/60 uppercase mb-3 font-bold tracking-wider">
              Collision Mesh
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="px-2 py-1 bg-emerald-900/20 text-emerald-400/80 border border-emerald-500/20">
                Capsule: Active
              </div>
              <div className="px-2 py-1 bg-emerald-900/20 text-emerald-400/80 border border-emerald-500/20">
                Floor: Detected
              </div>
              <div className="px-2 py-1 bg-emerald-900/20 text-emerald-400/80 border border-emerald-500/20">
                Step: Offset [0.3]
              </div>
              <div className="px-2 py-1 bg-emerald-900/20 text-emerald-400/80 border border-emerald-500/20">
                Slopes: Normal
              </div>
            </div>
          </div>
        </div>

        {/* Right Overlay: Movement Matrix */}
        <div
          className={`absolute right-8 top-12 transition-all duration-500 ${locked ? "opacity-100 translate-x-0" : "opacity-20 translate-x-4"}`}
        >
          <div className="bg-black/80 p-5 w-72 border border-emerald-500/20 backdrop-blur-sm shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <h3 className="text-[10px] text-emerald-500/80 uppercase mb-4 tracking-wider font-bold">
              Movement capabilities
            </h3>
            <div className="space-y-1 font-mono">
              <div className="flex items-center justify-between py-1.5 border-b border-emerald-900/30">
                <span className="text-xs text-emerald-100">
                  Vaulting / Parkour
                </span>
                <div className="w-2 h-2 rounded-[1px] bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-emerald-900/30">
                <span className="text-xs text-emerald-100">
                  Dynamic Climbing
                </span>
                <div className="w-2 h-2 rounded-[1px] bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-emerald-900/30">
                <span className="text-xs text-emerald-100">Leaning (L/R)</span>
                <div className="w-2 h-2 rounded-[1px] bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-emerald-900/30">
                <span className="text-xs text-emerald-100">
                  Prone Navigation
                </span>
                <div className="w-2 h-2 rounded-[1px] bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
              </div>
              <div className="flex items-center justify-between pt-1.5">
                <span className="text-xs text-emerald-100">Physic Grab</span>
                <div className="w-2 h-2 rounded-[1px] bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col space-y-2 font-mono">
            <div className="bg-amber-500/10 text-amber-400 text-[10px] p-3 border border-amber-500/30 backdrop-blur-sm shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              [!] READY FOR OBJECT INJECTION
            </div>
          </div>
        </div>

        {/* Full-screen Overlay for Initial Boot */}
        {!started && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#010409]/90 pointer-events-none backdrop-blur-lg">
            <div className="mb-8 text-emerald-400 tracking-[0.3em] font-mono text-xs uppercase font-bold animate-pulse drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
              System Sandbox Ready
            </div>
            <div className="inline-flex items-center space-x-3 bg-emerald-900/20 px-8 py-4 rounded border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <span className="text-sm text-emerald-50 uppercase tracking-[0.2em] font-bold font-mono">
                Click Anywhere to Initialize Simulation
              </span>
            </div>
            <div className="mt-6 text-emerald-500/60 font-mono text-[10px] tracking-widest uppercase">
              Requires Pointer Lock
            </div>
          </div>
        )}

        {/* HUD Notification when Unlocked (Cursor Free Mode) */}
        {started && !locked && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 bg-black/80 border border-cyan-500/50 px-6 py-2 rounded-sm pointer-events-none shadow-[0_0_20px_rgba(6,182,212,0.4)] backdrop-blur-md">
            <span className="text-[10px] text-cyan-300 font-bold tracking-[0.1em] uppercase font-mono">
              &gt; Cursor Free Mode - Click Canvas to Resume Movement_
            </span>
          </div>
        )}
      </div>

      {/* Bottom HUD: Key Bindings & Log */}
      <div className="h-40 border-t border-emerald-500/30 bg-[#010409]/80 flex z-10 pointer-events-none backdrop-blur-md font-mono">
        <div className="flex-1 p-6 border-r border-emerald-500/20">
          <div className="text-[10px] text-emerald-500/50 uppercase mb-3 font-bold tracking-widest">
            Event Stream
          </div>
          <div className="space-y-1">
            <div className="text-xs text-cyan-400">
              <span className="text-cyan-500/40 mr-2">12:00:01</span>{" "}
              PlayerController initialized...
            </div>
            <div className="text-xs text-cyan-400">
              <span className="text-cyan-500/40 mr-2">12:00:01</span> Collision
              solvers active...
            </div>
            <div className="text-xs text-cyan-400">
              <span className="text-cyan-500/40 mr-2">12:00:02</span> Gravity
              set to -15m/s²
            </div>
            <div className="text-xs text-emerald-100">
              <span className="text-emerald-500/40 mr-2">
                {timeStr || "12:00:02"}
              </span>{" "}
              {locked
                ? "Pointer locked, movement active."
                : "Awaiting input..."}
            </div>
          </div>
        </div>
        <div className="w-[400px] p-6 grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] text-emerald-500/50 uppercase mb-3 font-bold tracking-widest">
              Navigation
            </div>
            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between">
                <span className="text-emerald-500/60">W A S D</span>
                <span className="text-emerald-100">Move</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-500/60">Shift</span>
                <span className="text-emerald-100">Sprint</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-500/60">C</span>
                <span className="text-emerald-100">Crouch</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-500/60">Z</span>
                <span className="text-emerald-100">Prone</span>
              </div>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-emerald-500/50 uppercase mb-3 font-bold tracking-widest">
              Interaction
            </div>
            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between">
                <span className="text-emerald-500/60">E</span>
                <span className="text-emerald-100">Interact</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-500/60">Q / E</span>
                <span className="text-emerald-100">Lean</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-500/60">Space</span>
                <span className="text-emerald-100">Vault/Jump</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
