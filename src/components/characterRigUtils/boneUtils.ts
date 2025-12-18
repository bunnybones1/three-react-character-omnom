import { Bone, Euler } from "three";

export type BoneState = {
  bone: Bone;
  restRotation: Euler;
};
export function setRot(
  bones: Map<string, BoneState>,
  name: string,
  x: number,
  y: number,
  z: number,
) {
  const entry = bones.get(name);
  if (!entry) {
    return;
  }
  const { bone, restRotation } = entry;
  bone.rotation.set(restRotation.x + x, restRotation.y + y, restRotation.z + z);
}
export function getBone(bones: Map<string, BoneState>, name: string) {
  const entry = bones.get(name);
  if (!entry) {
    return;
  }
  const { bone } = entry;
  return bone;
}
