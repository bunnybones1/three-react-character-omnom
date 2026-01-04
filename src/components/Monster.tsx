import { useGLTF } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import { Bone, Color, Group, Mesh, MeshStandardMaterial, SkinnedMesh } from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { useMonsterAnimation } from "./useMonsterAnimation";
import { type BoneState } from "./characterRigUtils/boneUtils";
import type { Eul, Vec3 } from "./types";
import { DEFAULT_MONSTER_URL } from "../constants";

const TARGET_BONES = [
  "Bone-root",
  "Bone-shoulder-L",
  "Bone-elbow-L",
  "Bone-wrist-L",
  "Bone-shoulder-R",
  "Bone-elbow-R",
  "Bone-wrist-R",
  "Bone-mouth-lower-L",
  "Bone-mouth-lower-R",
  "Bone-jaw-and-chin",
  "Bone-jaw-lower",
  "Bone-mouth-upper-L",
  "Bone-mouth-upper-R",
  "Bone-head",
  "Bone-hip-L",
  "Bone-knee-L",
  "Bone-foot-L",
  "Bone-ankle-L",
  "Bone-hip-R",
  "Bone-knee-R",
  "Bone-foot-R",
  "Bone-ankle-R",
];

function makeColor(color?: number) {
  const colorValue = new Color(color);
  if (color === undefined) {
    colorValue.setHSL(Math.random(), 1, 0.5);
  }
  return colorValue;
}

export type MonsterProps = {
  color?: number;
  position?: Vec3;
  lookTarget?: Vec3;
  rotation?: Eul;
  modelUrl?: string;
  markersEnabled?: boolean;
};

const DEFAULT_POSITION: Vec3 = [0, 0, 0];
const DEFAULT_LOOK_TARGET: Vec3 = [0, 2, -10];
const DEFAULT_ROTATION: Eul = [0, 0, 0];

export function Monster(props: MonsterProps) {
  const {
    color,
    position = DEFAULT_POSITION,
    lookTarget = DEFAULT_LOOK_TARGET,
    rotation = DEFAULT_ROTATION,
    modelUrl = DEFAULT_MONSTER_URL,
    markersEnabled = false,
  } = props;
  const gltf = useGLTF(modelUrl);
  const colorRef = useRef<Color>(makeColor(color));
  const scene = useMemo(() => SkeletonUtils.clone(gltf.scene) as Group, [gltf.scene]);
  const bonesRef = useRef<Map<string, BoneState>>(new Map());
  const phaseRef = useRef(Math.random() * Math.PI * 2);

  useLayoutEffect(() => {
    colorRef.current = makeColor(color);
    const bones = new Map<string, BoneState>();
    scene.traverse((child) => {
      if (child instanceof Mesh || child instanceof SkinnedMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material.name === "skin" && child.material instanceof MeshStandardMaterial) {
          if (!child.userData.clonedMaterial) {
            child.material = child.material.clone();
            child.userData.clonedMaterial = true;
          }
          child.material.color.copy(colorRef.current);
        }
      }
      if (child instanceof Bone && TARGET_BONES.includes(child.name)) {
        const storedRotation = child.userData.restRotation as BoneState["restRotation"] | undefined;
        const restRotation = storedRotation ?? child.rotation.clone();
        if (!storedRotation) {
          child.userData.restRotation = restRotation;
        }
        bones.set(child.name, { bone: child, restRotation });
      }
    });
    bonesRef.current = bones;
  }, [scene, color]);

  useMonsterAnimation(bonesRef, phaseRef, position, rotation, lookTarget, markersEnabled);

  return <primitive object={scene} />;
}

function preloadMonster(url: string = DEFAULT_MONSTER_URL) {
  useGLTF.preload(url);
}

preloadMonster();

export default Monster;
