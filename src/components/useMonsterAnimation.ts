import { useFrame } from "@react-three/fiber";
import { RefObject, useEffect, useRef } from "react";
import { AxesHelper, Euler, Quaternion, Vector3 } from "three";
import type { Object3D } from "three";
import { BoneState, setRot, getBone } from "./characterRigUtils/boneUtils";
import { runArm } from "./characterRigUtils/ik/arm";
import { setShouldersAndHip } from "./characterRigUtils/setShouldersAndHip";
import { runLeg } from "./characterRigUtils/ik/leg";
import { setMarker } from "./characterRigUtils/setMarker";
import { FeetManager } from "./characterRigUtils/FeetManager";
import { lookAtLocal } from "./characterRigUtils/lookAtLocal";
import type { Eul, Vec3 } from "./types";
import { applyEul, vec3ToVector3 } from "./mathUtils";
import { translateAtEuler } from "./characterRigUtils/translateAtEuler";

const lookAxisYPos = new Vector3(0, 1, 0);
const lookAxisXPos = new Vector3(1, 0, 0);
const lookAxisZPos = new Vector3(0, 0, 1);
const lookAxisXNeg = new Vector3(-1, 0, 0);
const lookAxisZNeg = new Vector3(0, 0, -1);

const idealLegLength = 3;
const legLookHint = new Vector3(0, 0, -10);
const legLookForward = new Vector3(0, -1, 0.8).normalize();

const SIDES = ["L", "R"] as const;

const __tempLookTarget = new Vector3();
const __tempLookTargetLocal = new Vector3();
const __tempLookTargetHeadLocal = new Vector3();
const __tempHeadForward = new Vector3(0, 1, 0);
const __tempHeadRight = new Vector3(1, 0, 0);
const __tempEyeForward = new Vector3();
const __tempEyeRight = new Vector3();
const __defaultEuler = new Euler();

const __tempQuat = new Quaternion();
const __tempRootPositionWorld = new Vector3();
const __tempRootPositionLocal = new Vector3();

function applyRootTransform(root: Object3D, rootPosition: Vec3, rootRotation: Eul) {
  const rootWorld = vec3ToVector3(rootPosition, __tempRootPositionWorld);
  const rootLocal = root.parent ? __tempRootPositionLocal.copy(rootWorld) : rootWorld;
  if (root.parent) {
    root.parent.worldToLocal(rootLocal);
  }
  root.position.copy(rootLocal);
  applyEul(root.rotation, rootRotation);
}

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
  scale: number,
  floorHeight: number,
  rootRotation: Eul,
  lookTarget: Vec3,
  markersEnabled = false,
) {
  const markersRef = useRef<Map<string, AxesHelper>>(new Map());
  const eyesRef = useRef<{ left?: Object3D; right?: Object3D }>({});

  const feetManRef = useRef(new FeetManager({ scale, floorHeight }));
  if (!(feetManRef.current instanceof FeetManager)) {
    feetManRef.current = new FeetManager({ scale, floorHeight });
  }
  useEffect(() => {
    feetManRef.current = new FeetManager({ scale, floorHeight });
  }, [scale, floorHeight]);

  useEffect(() => {
    const rootBone = getBone(bonesRef.current, "Bone-root")!;
    applyRootTransform(rootBone, rootPosition, rootRotation);

    const feetMan = feetManRef.current;
    for (let i = 0; i < SIDES.length; i++) {
      const side = SIDES[i];
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

    const markers = markersEnabled ? markersRef : undefined;

    applyRootTransform(root, rootPosition, rootRotation);
    if (markers) {
      setMarker(markers, root.parent, "position", root.position, root.rotation);
    }

    const phase = phaseRef.current;

    const lookTargetWorld = vec3ToVector3(lookTarget, __tempLookTarget);
    const lookTargetLocal = root.parent
      ? __tempLookTargetLocal.copy(lookTargetWorld)
      : lookTargetWorld;
    if (root.parent) {
      root.parent.worldToLocal(lookTargetLocal);
    }

    const wristRaiseL = Math.sin(t * 2 + phase) * 0.1;
    const wristFlexL = Math.sin(t * 2 + phase - 1) * 1.2;
    const wristRaiseR = Math.sin(t * 2 + phase + Math.PI) * 0.1;
    const wristFlexR = Math.sin(t * 2 + phase + Math.PI + 1) * 1.2;

    const jawOpen = (Math.sin(t * 6.1 + phase) * 0.5 + 0.5) * 0.25;
    const headNod = Math.sin(t * 0.9 + phase + 0.3) * 0.12;
    const headYaw = Math.sin(t * 0.6 + phase) * 0.15;
    const headTilt = Math.sin(t * 1.1 + phase + 0.8) * 0.06;

    const headEntry = bones.get("Bone-head");
    if (!headEntry) {
      return;
    }
    const { bone: head } = headEntry;

    head.position.copy(root.position);
    head.rotation.copy(root.rotation);
    head.translateY(2);

    const t2 = root.position.clone();
    translateAtEuler(t2, root.rotation, 0, -10, 0);
    lookAtLocal(head, lookTargetLocal, __tempHeadForward, __tempHeadRight, t2);
    __tempQuat.copy(head.quaternion);
    head.rotation.copy(root.rotation);
    head.rotateZ(Math.PI * -0.4);
    head.rotateX(Math.PI * 0.5);
    head.quaternion.slerp(__tempQuat, 0.8);
    head.rotateX(headNod);
    head.rotateY(headYaw);
    head.rotateZ(headTilt);

    head.updateWorldMatrix(true, false);
    const lookTargetHeadLocal = __tempLookTargetHeadLocal.copy(lookTargetWorld);
    head.worldToLocal(lookTargetHeadLocal);

    const eyes = eyesRef.current;
    if (!eyes.left) {
      eyes.left = head.getObjectByName("eye-L") ?? undefined;
      if (eyes.left && !eyes.left.userData.restRotation) {
        eyes.left.userData.restRotation = eyes.left.rotation.clone();
      }
    }
    if (!eyes.right) {
      eyes.right = head.getObjectByName("eye-R") ?? undefined;
      if (eyes.right && !eyes.right.userData.restRotation) {
        eyes.right.userData.restRotation = eyes.right.rotation.clone();
      }
    }

    if (eyes.left) {
      const restRotation = eyes.left.userData.restRotation as Euler | undefined;
      if (restRotation) {
        __tempEyeForward.copy(lookAxisYPos).applyEuler(restRotation);
        __tempEyeRight.copy(lookAxisXPos).applyEuler(restRotation);
        lookAtLocal(eyes.left, lookTargetHeadLocal, __tempEyeForward, __tempEyeRight);
      }
    }
    if (eyes.right) {
      const restRotation = eyes.right.userData.restRotation as Euler | undefined;
      if (restRotation) {
        __tempEyeForward.copy(lookAxisYPos).applyEuler(restRotation);
        __tempEyeRight.copy(lookAxisXPos).applyEuler(restRotation);
        lookAtLocal(eyes.right, lookTargetHeadLocal, __tempEyeForward, __tempEyeRight);
      }
    }

    setRot(bones, "Bone-jaw-lower", 0, 0, jawOpen * 2 + -0.5);

    setShouldersAndHip(bones, root, "L", 1, markers);
    setShouldersAndHip(bones, root, "R", -1, markers);

    const feetMan = feetManRef.current;

    feetMan.update(getBone(bones, "Bone-hip-L")!, getBone(bones, "Bone-hip-R")!, delta);
    if (markersEnabled) {
      setMarker(markersRef, root.parent, "lookTarget", lookTargetLocal, __defaultEuler);
      setMarker(
        markersRef,
        root.parent!.parent,
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
