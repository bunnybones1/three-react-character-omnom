import { AxesHelper, Object3D } from "three";
import { BoneState, getBone } from "./boneUtils";
import { setMarker } from "./setMarker";
import { RefObject } from "react";

export function setShouldersAndHip(
  bones: Map<string, BoneState>,
  root: Object3D,
  side: "L" | "R",
  xScale: 1 | -1,
  markersRef?: RefObject<Map<string, AxesHelper>>,
) {
  const hip = getBone(bones, `Bone-hip-${side}`)!;
  const shoulder = getBone(bones, `Bone-shoulder-${side}`)!;
  hip.position.copy(root.position);
  hip.rotation.copy(root.rotation);
  hip.translateY(-1.1);
  hip.translateX(0.6 * xScale);
  // hip.rotateY(Math.PI);
  // hip.scale.set(1, 1, 1);
  shoulder.position.copy(root.position);
  shoulder.rotation.copy(root.rotation);
  shoulder.translateY(0.5);
  shoulder.translateX(0.7 * xScale);
  if (markersRef) {
    setMarker(markersRef, hip.parent, `hip-${side}`, hip.position, hip.rotation);
    setMarker(
      markersRef,
      shoulder.parent,
      `shoulder-${side}`,
      shoulder.position,
      shoulder.rotation,
    );
  }
}
