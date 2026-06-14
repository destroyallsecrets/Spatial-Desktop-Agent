import { create } from "zustand";
import { ModuleInstance } from "../sdk/types";

interface AgentStore {
  instances: ModuleInstance[];
  addInstance: (instance: ModuleInstance) => void;
  removeInstance: (id: string) => void;
  updateInstanceData: (id: string, data: Record<string, any>) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  instances: [],
  addInstance: (instance) =>
    set((state) => ({ instances: [...state.instances, instance] })),
  removeInstance: (id) =>
    set((state) => ({ instances: state.instances.filter((i) => i.id !== id) })),
  updateInstanceData: (id, data) =>
    set((state) => ({
      instances: state.instances.map((i) =>
        i.id === id ? { ...i, data: { ...(i.data || {}), ...data } } : i
      ),
    })),
}));
