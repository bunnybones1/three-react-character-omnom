import { useEffect } from "react";
import type { RefObject } from "react";
import type { WebGPURenderer } from "three/webgpu";

export function ResizeHandler({ rendererRef }: { rendererRef: RefObject<WebGPURenderer | null> }) {
  useEffect(() => {
    const handleResize = () => {
      rendererRef.current?.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, [rendererRef]);

  return null;
}
