import { RefObject } from "react";
import { AxesHelper, Euler, Object3D, Vector3 } from "three";

export function setMarker(
  markersRef: RefObject<Map<string, AxesHelper>>,
  node: Object3D | undefined | null,
  name: string,
  position?: Vector3,
  rotation?: Euler,
) {
  if (!node) {
    return;
  }
  const markers = markersRef.current;
  let marker = markers.get(name);
  if (!marker) {
    marker = new AxesHelper(1);
    marker.material.transparent = true;
    marker.material.depthTest = false;
    marker.name = `marker:${name}`;
    markers.set(name, marker);
    node.add(marker);
  }
  if (position) {
    marker.position.copy(position);
  }
  if (rotation) {
    marker.rotation.copy(rotation);
  }

  return marker;
}
