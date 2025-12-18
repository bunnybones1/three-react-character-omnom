import { AxesHelper, Vector3 } from "three";
import { BoneState, getBone } from "../boneUtils";
import { setMarker } from "../setMarker";
import { RefObject } from "react";
import { lookAtLocal } from "../lookAtLocal";

const armHalfLength = 2;
const lookDownHint = new Vector3(0, -10, 0);

export function runArm(
  bones: Map<string, BoneState>,
  side: "L" | "R",
  wristRaise: number,
  wristFlex: number,
  config: {
    wristX: number;
    wristYaw: number;
    elbowLookForward: Vector3;
    elbowLookRight: Vector3;
    shoulderLookForward: Vector3;
    shoulderLookRight: Vector3;
    sideMultiplier: number;
  },
  markersRef?: RefObject<Map<string, AxesHelper>>,
) {
  const root = getBone(bones, "Bone-root")!;
  const wristName = `Bone-wrist-${side}`;
  const shoulderName = `Bone-shoulder-${side}`;
  const elbowName = `Bone-elbow-${side}`;

  const elbowLookForward = config.elbowLookForward.clone().applyEuler(root.rotation);
  const elbowLookRight = config.elbowLookRight.clone().applyEuler(root.rotation);
  const shoulderLookForward = config.shoulderLookForward.clone().applyEuler(root.rotation);
  const shoulderLookRight = config.shoulderLookRight.clone().applyEuler(root.rotation);

  const wrist = getBone(bones, wristName)!;
  const shoulder = getBone(bones, shoulderName)!;
  const elbow = getBone(bones, elbowName)!;

  wrist.position.copy(root.position);
  wrist.rotation.copy(root.rotation);
  wrist.translateX(config.wristX);
  // wrist.rotateX(1);
  wrist.position.y += wristRaise * 20;
  // wrist.rotation.z += config.wristYaw;
  wrist.rotateZ(Math.PI * 0.5 * config.sideMultiplier);
  wrist.rotateX(1);
  wrist.rotateZ(wristFlex);

  const parent = elbow.parent;

  elbow.scale.set(1, 1.4, 1);
  if (markersRef) {
    setMarker(markersRef, parent, `wrist-${side}`, wrist.position, wrist.rotation);
  }

  const wristVec = new Vector3(0, -armHalfLength, 0).applyEuler(wrist.rotation);
  const virtualElbow = wrist.position.clone().add(wristVec);
  const shoulderToElbow = new Vector3().subVectors(virtualElbow, shoulder.position);
  if (shoulderToElbow.length() > armHalfLength) {
    shoulderToElbow.setLength(armHalfLength);
    virtualElbow.copy(shoulder.position).add(shoulderToElbow);
  }
  elbow.position.copy(virtualElbow);

  const virtualShoulderWristLink = wrist.position
    .clone()
    .add(shoulder.position)
    .multiplyScalar(0.5)
    .lerp(shoulder.position, 0.33);

  if (markersRef) {
    setMarker(markersRef, parent, `ShoulderWristLink-${side}`, virtualShoulderWristLink);
  }

  const antiWristVec = elbow.position
    .clone()
    .add(elbow.position.clone().sub(wrist.position).multiplyScalar(-1));
  lookAtLocal(elbow, virtualShoulderWristLink, elbowLookForward, elbowLookRight, antiWristVec);
  lookAtLocal(shoulder, virtualElbow, shoulderLookForward, shoulderLookRight, lookDownHint);
  if (markersRef) {
    setMarker(markersRef, parent, `shoulder-${side}`, shoulder.position, shoulder.rotation);
    setMarker(markersRef, parent, `elbow-${side}`, elbow.position, elbow.rotation);
  }
}
