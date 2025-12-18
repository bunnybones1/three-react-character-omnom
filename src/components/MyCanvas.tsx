import { Canvas, extend } from "@react-three/fiber";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import * as THREE from "three/webgpu";
import { ResizeHandler } from "./ResizeHandler";

extend(THREE as unknown as Parameters<typeof extend>[0]);

export function MyCanvas({ children }: { children: ReactNode }) {
  const rendererRef = useRef<THREE.WebGPURenderer | null>(null);
  const [frameloop, setFrameloop] = useState<"never" | "always">("never");
  return (
    <Canvas
      onCreated={(state) => {
        state.setSize(window.innerWidth, window.innerHeight);
      }}
      frameloop={frameloop}
      camera={{
        position: [8.6, 0.6, 0],
        near: 0.1,
        far: 50,
        fov: 65,
        // zoom: 1,
      }}
      shadows={"variance"}
      gl={(props: unknown) => {
        const canvas = (props as { canvas: HTMLCanvasElement }).canvas;
        const renderer = new THREE.WebGPURenderer({
          canvas,
          powerPreference: "high-performance",
          antialias: false,
          alpha: false,
          stencil: false,
        });

        // Initialize WebGPU and store renderer reference
        renderer.init().then(() => setFrameloop("always"));
        rendererRef.current = renderer;
        return renderer;
      }}
    >
      {children}
      <ResizeHandler rendererRef={rendererRef} />
    </Canvas>
  );
}
