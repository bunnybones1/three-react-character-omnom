import { Vector3, Euler } from "three";
import type { Vec3, Eul } from "./types";

type Triplet = [number, number, number];
function isTriplet(value: unknown): value is Triplet {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    typeof value[2] === "number"
  );
}
export function applyVec3(target: Vector3, value: Vec3) {
  if (isTriplet(value)) {
    target.set(value[0], value[1], value[2]);
  } else {
    target.copy(value);
  }
}
export function applyEul(target: Euler, value: Eul) {
  if (isTriplet(value)) {
    target.set(value[0], value[1], value[2]);
  } else {
    target.copy(value);
  }
}
