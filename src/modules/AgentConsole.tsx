import { Html } from "@react-three/drei";
import { ModuleManifest, SpatialVolume } from "../sdk/types";
import { useState } from "react";
import { useAgentStore } from "../store/useAgentStore";
import { webBrowserManifest } from "./WebBrowser";
import { notesManifest } from "./NotesModule";
import { clockManifest } from "./ClockModule";

export const agentConsoleManifest: ModuleManifest = {
  id: "core.agent_console",
  name: "Agent Console",
  purpose: "Primary text interface for communicating with the Spatial Agent.",
  version: "0.1.0",
  capabilities: [{ name: "agent.converse" }],
  surface: "projected",
  defaultAnchor: "floating",
};

export function AgentConsole({ volume }: { volume: SpatialVolume }) {
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<string[]>([
    "[System]: Agent Console initialized.",
    "[System]: Awaiting input...",
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    const userMsg = input;
    setInput("");
    setLogs((prev) => [...prev, `[User]: ${userMsg}`]);
    setIsProcessing(true);

    try {
      // Get the current scene state to send to the agent
      const sceneState = useAgentStore.getState().instances.map((inst) => ({
        id: inst.id,
        moduleId: inst.manifest.id,
        position: inst.volume.position,
        rotation: inst.volume.rotation,
        data: inst.data,
      }));

      const response = await fetch("/api/agent/converse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, sceneState }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      setLogs((prev) => [...prev, `[Agent]: ${data.text}`]);

      // Handle any spatial actions the agent requested
      if (data.actions && data.actions.length > 0) {
        const addInstance = useAgentStore.getState().addInstance;

        data.actions.forEach((action: any) => {
          if (action.type === "SPAWN_MODULE") {
            // Basic mock registry lookup logic for spawning
            const manifest =
              action.moduleId === "core.web_browser"
                ? webBrowserManifest
                : action.moduleId === "core.notes"
                  ? notesManifest
                  : action.moduleId === "core.clock"
                    ? clockManifest
                    : {
                        id: action.moduleId,
                        name: "Unknown Module",
                        purpose: "Spawned by agent",
                        version: "0.1.0",
                        capabilities: [],
                        surface: "volumetric" as const,
                        defaultAnchor: "floating" as const,
                      };

            addInstance({
              id: "inst_" + Math.random().toString(36).substr(2, 9),
              manifest,
              volume: {
                position: action.position || [0, 1.5, -4],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            });
          } else if (action.type === "REMOVE_MODULE") {
            const removeInstance = useAgentStore.getState().removeInstance;
            removeInstance(action.instanceId);
          } else if (action.type === "UPDATE_INSTANCE_DATA") {
            const updateInstanceData = useAgentStore.getState().updateInstanceData;
            updateInstanceData(action.instanceId, action.data);
          }
        });
      }
    } catch (err: any) {
      setLogs((prev) => [...prev, `[System Error]: ${err.message}`]);
    } finally {
      setIsProcessing(false);
    }
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
        <div className="w-[450px] h-[550px] bg-black/90 backdrop-blur-md border border-emerald-500/30 rounded-lg flex flex-col font-mono text-emerald-50 shadow-[0_0_30px_rgba(16,185,129,0.15)] overflow-hidden cursor-default transition-all duration-300 hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:border-emerald-500/50">
          <div className="bg-[#020813]/80 p-4 border-b border-emerald-500/30 flex justify-between items-center shadow-lg">
            <div className="flex items-center space-x-3">
              <div
                className={`w-2 h-2 rounded-full ${isProcessing ? "bg-amber-400" : "bg-emerald-400"} animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]`}
              ></div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-bold">
                Agent Console v0.1
              </span>
            </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-3 text-xs flex flex-col justify-end bg-gradient-to-b from-transparent to-emerald-900/10">
            {logs.map((log, i) => (
              <div
                key={i}
                className={`tracking-wide leading-relaxed ${log.startsWith("[User]") ? "text-emerald-100" : log.startsWith("[System") ? "text-rose-400" : "text-emerald-400 font-bold drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]"}`}
              >
                {log}
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-emerald-500/30 bg-[#010409]/80 flex items-center space-x-3">
            <span className="text-emerald-500 font-bold animate-pulse">
              &gt;_
            </span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isProcessing ? "Processing..." : "Enter command..."}
              disabled={isProcessing}
              className="flex-1 bg-transparent border-none outline-none text-xs placeholder-emerald-800 text-emerald-200 font-mono tracking-wide disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isProcessing}
              className="text-[10px] uppercase tracking-widest text-emerald-400 hover:text-emerald-200 px-3 py-1.5 border border-emerald-500/50 rounded hover:bg-emerald-500/20 hover:shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </Html>
    </group>
  );
}
