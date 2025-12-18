import { useFrame } from "@react-three/fiber";
import { RefObject, useEffect, useRef } from "react";
import { AxesHelper, Vector3 } from "three";
import { BoneState, setRot, getBone } from "./characterRigUtils/boneUtils";
import { runArm } from "./characterRigUtils/ik/arm";
import { setShouldersAndHip } from "./characterRigUtils/setShouldersAndHip";
import { runLeg } from "./characterRigUtils/ik/leg";
import { setMarker } from "./characterRigUtils/setMarker";
import { FeetManager } from "./characterRigUtils/FeetManager";
import type { Eul, Vec3 } from "./types";
import { applyVec3, applyEul } from "./mathUtils";

const lookAxisYPos = new Vector3(0, 1, 0);
const lookAxisXPos = new Vector3(1, 0, 0);
const lookAxisZPos = new Vector3(0, 0, 1);
const lookAxisXNeg = new Vector3(-1, 0, 0);
const lookAxisZNeg = new Vector3(0, 0, -1);

const idealLegLength = 3;
const legLookHint = new Vector3(0, 0, -10);
const legLookForward = new Vector3(0, -1, 0.8).normalize();

const leftArmConfig = {
  wristX: 4,
  wristYaw: -1,
  elbowLookForward: lookAxisZPos,
  elbowLookRight: lookAxisYPos,
  shoulderLookForward: lookAxisYPos,
  shoulderLookRight: lookAxisXPos,
  sideMultiplier: -1,
};
const rightArmConfig = {
  wristX: -4,
  wristYaw: 1,
  elbowLookForward: lookAxisZPos,
  elbowLookRight: lookAxisYPos,
  shoulderLookForward: lookAxisYPos,
  shoulderLookRight: lookAxisXNeg,
  sideMultiplier: 1,
};
const leftLegConfig = {
  idealLegLength,
  hipLookForward: lookAxisYPos,
  hipLookRight: lookAxisXPos,
  ankleLookForward: legLookForward,
  ankleLookRight: lookAxisZNeg,
  lookHint: legLookHint,
};
const rightLegConfig = {
  idealLegLength,
  hipLookForward: lookAxisYPos,
  hipLookRight: lookAxisXNeg,
  ankleLookForward: legLookForward,
  ankleLookRight: lookAxisZNeg,
  lookHint: legLookHint,
};

export function useMonsterAnimation(
  bonesRef: RefObject<Map<string, BoneState>>,
  phaseRef: RefObject<number>,
  rootPosition: Vec3,
  rootRotation: Eul,
  markersEnabled = false,
) {
  const markersRef = useRef<Map<string, AxesHelper>>(new Map());

  const feetManRef = useRef(new FeetManager());
  if (!(feetManRef.current instanceof FeetManager)) {
    feetManRef.current = new FeetManager();
  }

  useEffect(() => {
    const rootBone = getBone(bonesRef.current, "Bone-root")!;
    applyVec3(rootBone.position, rootPosition);
    applyEul(rootBone.rotation, rootRotation);

    const feetMan = feetManRef.current;
    const sides = ["L", "R"] as const;
    for (let i = 0; i < sides.length; i++) {
      const side = sides[i];
      const multX = i === 0 ? 1 : -1;
      const ankleBone = getBone(bonesRef.current, `Bone-ankle-${side}`)!;
      ankleBone.position.copy(rootBone.position);
      ankleBone.rotation.copy(rootBone.rotation);
      ankleBone.translateY(-1 - idealLegLength);
      ankleBone.translateX(multX);
      ankleBone.rotateZ(Math.PI);
      ankleBone.rotateX(Math.PI * 0.25);
      feetMan[side].plant(ankleBone.position, ankleBone.rotation);
    }
  });

  useFrame((state, delta) => {
    const bones = bonesRef.current;
    if (!bones.size) {
      return;
    }
    const t = state.clock.elapsedTime * 4;
    const root = getBone(bones, "Bone-root")!;

    applyVec3(root.position, rootPosition);
    applyEul(root.rotation, rootRotation);
    setMarker(markersRef, root.parent, "position", root.position, root.rotation);

    const phase = phaseRef.current;

    const wristRaiseL = Math.sin(t * 2 + phase) * 0.1;
    const wristFlexL = Math.sin(t * 2 + phase - 1) * 1.2;
    const wristRaiseR = Math.sin(t * 2 + phase + Math.PI) * 0.1;
    const wristFlexR = Math.sin(t * 2 + phase + Math.PI + 1) * 1.2;

    const jawOpen = (Math.sin(t * 6.1 + phase) * 0.5 + 0.5) * 0.25;
    const headNod = Math.sin(t * 0.9 + phase + 0.3) * 0.12;
    const headYaw = Math.sin(t * 0.6 + phase) * 0.15;
    const headTilt = Math.sin(t * 1.1 + phase + 0.8) * 0.06;

    const head = getBone(bones, "Bone-head")!;

    head.position.copy(root.position);
    head.rotation.copy(root.rotation);
    head.translateY(2);

    setRot(bones, "Bone-head", headNod, headYaw, headTilt);
    setRot(bones, "Bone-jaw-lower", 0, 0, jawOpen * 2 + -0.5);

    const markers = markersEnabled ? markersRef : undefined;

    setShouldersAndHip(bones, root, "L", 1, markers);
    setShouldersAndHip(bones, root, "R", -1, markers);

    const feetMan = feetManRef.current;

    feetMan.update(getBone(bones, "Bone-hip-L")!, getBone(bones, "Bone-hip-R")!, delta);
    if (markersEnabled) {
      setMarker(
        markersRef,
        root.parent,
        "desired-footL",
        feetMan.L.desired.position,
        feetMan.L.desired.rotation,
      );
      setMarker(
        markersRef,
        root.parent,
        "actual-footL",
        feetMan.L.actual.position,
        feetMan.L.actual.rotation,
      );
      setMarker(
        markersRef,
        root.parent,
        "desired-footR",
        feetMan.R.desired.position,
        feetMan.R.desired.rotation,
      );
      setMarker(
        markersRef,
        root.parent,
        "actual-footR",
        feetMan.R.actual.position,
        feetMan.R.actual.rotation,
      );
    }

    runArm(bones, "L", wristRaiseL, wristFlexL, leftArmConfig, markers);
    runArm(bones, "R", wristRaiseR, wristFlexR, rightArmConfig, markers);

    runLeg(bones, "L", feetMan.L.actual, leftLegConfig, markers);
    runLeg(bones, "R", feetMan.R.actual, rightLegConfig, markers);

    // setRot("Bone-jaw-and-chin", jawOpen, 0, 0);
    // setRot("Bone-mouth-lower-L", jawOpen * 0.5, 0, 0);
    // setRot("Bone-mouth-lower-R", jawOpen * 0.5, 0, 0);
    // setRot("Bone-mouth-upper-L", -jawOpen * 0.25, 0, 0);
    // setRot("Bone-mouth-upper-R", -jawOpen * 0.25, 0, 0);
  });
}
