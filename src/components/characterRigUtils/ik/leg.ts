import { AxesHelper, Quaternion, Vector3 } from "three";
import type { RefObject } from "react";
import { BoneState, getBone } from "../boneUtils";
import { lookAtLocal } from "../lookAtLocal";
import { setMarker } from "../setMarker";
import { SpatialData } from "../SpatialData";
import { translateAtEuler } from "../translateAtEuler";

const hipToAnkle = new Vector3();
const virtualKnee = new Vector3();

export function runLeg(
  bones: Map<string, BoneState>,
  side: "L" | "R",
  foot: SpatialData,
  config: {
    idealLegLength: number;
    hipLookForward: Vector3;
    hipLookRight: Vector3;
    ankleLookForward: Vector3;
    ankleLookRight: Vector3;
    lookHint: Vector3;
  },
  markersRef?: RefObject<Map<string, AxesHelper>>,
) {
  const ankle = getBone(bones, `Bone-ankle-${side}`);
  const hip = getBone(bones, `Bone-hip-${side}`);
  const knee = getBone(bones, `Bone-knee-${side}`);
  if (!ankle || !hip || !knee) {
    return;
  }

  ankle.position.copy(foot.position);
  ankle.rotation.copy(foot.rotation);
  const ankleQuat = new Quaternion().setFromEuler(ankle.rotation);

  ankle.rotateY(Math.PI);
  ankle.rotateX(Math.PI * -0.8);
  if (markersRef) {
    setMarker(markersRef, ankle.parent, `foot-${side}`, ankle.position, ankle.rotation);
  }

  hipToAnkle.subVectors(ankle.position, hip.position);
  const legLengthRatio = hipToAnkle.length() / config.idealLegLength;
  if (legLengthRatio > 1) {
    ankle.position.lerp(hip.position, legLengthRatio - 1);
  }

  virtualKnee.copy(ankle.position).lerp(hip.position, 0.5);
  const bendRatio = Math.sin(Math.min(1, legLengthRatio) * Math.PI);
  translateAtEuler(virtualKnee, hip.rotation, 0, 0, bendRatio * config.idealLegLength * 0.5);
  // virtualKnee.z = bendRatio * config.idealLegLength * 0.5;
  knee.position.copy(virtualKnee);
  const hipQuat = new Quaternion().setFromEuler(hip.rotation);
  const kneeQuat = new Quaternion().slerpQuaternions(hipQuat, ankleQuat, 0.5);
  knee.rotation.setFromQuaternion(kneeQuat);
  knee.rotateY(Math.PI);
  knee.rotateX(Math.PI);
  // knee.rotateZ(Math.PI);

  lookAtLocal(hip, virtualKnee, config.hipLookForward, config.hipLookRight, config.lookHint);
  knee.scale.y = 1 + bendRatio * 0.5;

  if (markersRef) {
    setMarker(markersRef, knee.parent, `knee-${side}`, knee.position, knee.rotation);
    setMarker(markersRef, ankle.parent, `ankle-${side}`, ankle.position, ankle.rotation);
  }
}
