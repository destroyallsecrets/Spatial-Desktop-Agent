import { useEffect, useRef } from "react";
import { AgentConsole, agentConsoleManifest } from "../modules/AgentConsole";
import { WebBrowser, webBrowserManifest } from "../modules/WebBrowser";
import { NotesModule, notesManifest } from "../modules/NotesModule";
import { ClockModule, clockManifest } from "../modules/ClockModule";
import { FallbackModule } from "../modules/FallbackModule";
import { useAgentStore } from "../store/useAgentStore";

const MODULE_REGISTRY: Record<
  string,
  React.FC<{ volume: any; manifest?: any; instanceId: string; instance: any }>
> = {
  "core.agent_console": AgentConsole,
  "core.web_browser": WebBrowser,
  "core.notes": NotesModule,
  "core.clock": ClockModule,
};

export function ModuleHost() {
  const instances = useAgentStore((state) => state.instances);
  const addInstance = useAgentStore((state) => state.addInstance);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Only spawn the initial reference modules if the store is empty
    if (useAgentStore.getState().instances.length === 0) {
      addInstance({
        id: "inst_1",
        manifest: agentConsoleManifest,
        volume: {
          position: [-1.5, 1.5, -3],
          rotation: [0, 0.2, 0],
          scale: [1, 1, 1],
        },
        data: {}
      });
      addInstance({
        id: "inst_2",
        manifest: webBrowserManifest,
        volume: {
          position: [3, 1.8, -3],
          rotation: [0, -0.3, 0],
          scale: [0.8, 0.8, 0.8],
        },
        data: {
          url: "https://en.wikipedia.org/wiki/Ghost_in_the_Shell",
          title: "CyberNet Core Index",
          rawText: "Cybernetic web systems online. Ready for net plunge."
        }
      });
    }
  }, []);

  return (
    <group>
      {instances.map((inst) => {
        const Component = MODULE_REGISTRY[inst.manifest.id] || FallbackModule;
        return (
          <Component
            key={inst.id}
            instanceId={inst.id}
            instance={inst}
            volume={inst.volume}
            manifest={inst.manifest}
          />
        );
      })}
    </group>
  );
}
