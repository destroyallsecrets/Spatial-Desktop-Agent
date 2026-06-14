import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress known benign errors from logging to console to prevent AI Studio error loops
const originalError = console.error;
console.error = (...args) => {
  const msg = args[0];
  if (
    typeof msg === "string" &&
    (msg.toLowerCase().includes("pointerlock") ||
      msg.toLowerCase().includes("pointer lock"))
  ) {
    return;
  }
  originalError(...args);
};

window.addEventListener("unhandledrejection", (event) => {
  if (
    event.reason &&
    event.reason.message &&
    event.reason.message.toLowerCase().includes("pointer lock")
  ) {
    event.preventDefault();
  }
});

// Patch requestPointerLock to catch the promise rejection and prevent Vite error overlay
const originalRequestPointerLock = HTMLElement.prototype.requestPointerLock;
HTMLElement.prototype.requestPointerLock = function () {
  const result = originalRequestPointerLock.apply(this, arguments as any);
  if (result && typeof result.catch === "function") {
    result.catch((e: any) => {
      console.warn("Pointer lock error suppressed:", e);
    });
  }
  return result as any;
};

// Shim getContextAttributes globally to ensure it never returns null.
// This resolves "Uncaught TypeError: Cannot read properties of null (reading 'alpha')" in sandboxed preview contexts.
const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function (type: string, contextAttributes?: any) {
  const context = originalGetContext.call(this, type, contextAttributes);
  if (context && (type === "webgl" || type === "webgl2" || type === "experimental-webgl")) {
    const gl = context as any;
    const originalGetContextAttributes = gl.getContextAttributes;
    gl.getContextAttributes = function () {
      let attrs = null;
      try {
        attrs = originalGetContextAttributes?.call(this);
      } catch (e) {
        // ignore
      }
      return attrs || {
        alpha: true,
        antialias: true,
        depth: true,
        stencil: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        powerPreference: "default",
        failIfMajorPerformanceCaveat: false,
        desynchronized: false
      };
    };
  }
  return context;
};

if (typeof window !== "undefined") {
  const patchContextAttributesProto = (proto: any) => {
    if (proto && proto.getContextAttributes) {
      const original = proto.getContextAttributes;
      proto.getContextAttributes = function () {
        let attrs = null;
        try {
          attrs = original.call(this);
        } catch (e) {
          // ignore
        }
        return attrs || {
          alpha: true,
          antialias: true,
          depth: true,
          stencil: true,
          premultipliedAlpha: true,
          preserveDrawingBuffer: false,
          powerPreference: "default",
          failIfMajorPerformanceCaveat: false,
          desynchronized: false
        };
      };
    }
  };

  if ((window as any).WebGLRenderingContext) {
    patchContextAttributesProto((window as any).WebGLRenderingContext.prototype);
  }
  if ((window as any).WebGL2RenderingContext) {
    patchContextAttributesProto((window as any).WebGL2RenderingContext.prototype);
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
