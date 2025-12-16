import type { Dispatch, SetStateAction } from "react";
import type { Quality } from "../types";

export function Overlay({
  isPostProcessingEnabled,
  setIsPostProcessingEnabled,
  quality,
  setQuality,
}: {
  isPostProcessingEnabled: boolean;
  setIsPostProcessingEnabled: Dispatch<SetStateAction<boolean>>;
  quality: Quality;
  setQuality: Dispatch<SetStateAction<Quality>>;
}) {
  return (
    <div className="overlay">
      <footer>
        <div className="footer-buttons">
          <button onClick={() => setIsPostProcessingEnabled(!isPostProcessingEnabled)}>
            {isPostProcessingEnabled ? "Disable" : "Enable"} Post Processing
          </button>
          <button
            onClick={() => setQuality(quality === "default" ? "high" : "default")}
            className="toggle-quality"
          >
            {quality === "default" ? "Higher Quality" : "Performance Mode"}
          </button>
        </div>
        <a
          href="https://github.com/ektogamat/r3f-webgpu-starter"
          download
          className="download-button"
        ></a>
      </footer>
    </div>
  );
}
