import { useEffect, useState } from "react";

type ActionName =
  | "forward"
  | "backward"
  | "left"
  | "right"
  | "jump"
  | "sprint"
  | "crouch"
  | "prone"
  | "leanLeft"
  | "leanRight"
  | "interact";

const KEYS: Record<string, ActionName> = {
  KeyW: "forward",
  KeyS: "backward",
  KeyA: "left",
  KeyD: "right",
  Space: "jump",
  ShiftLeft: "sprint",
  KeyC: "crouch",
  KeyZ: "prone",
  KeyQ: "leanLeft",
  KeyE: "leanRight",
  KeyF: "interact",
};

export function usePlayerControls() {
  const [movement, setMovement] = useState<Record<ActionName, boolean>>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    crouch: false,
    prone: false,
    leanLeft: false,
    leanRight: false,
    interact: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName))
        return;
      const action = KEYS[e.code];
      if (action) {
        setMovement((m) => {
          // Toggle logic for crouch and prone can be handled here or in the player script.
          // For simplicity in raw input, we just map boolean holds.
          // If we want toggleable crouch, we can intercept that in Player.tsx
          return { ...m, [action]: true };
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName))
        return;
      const action = KEYS[e.code];
      if (action) {
        setMovement((m) => ({ ...m, [action]: false }));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return movement;
}
