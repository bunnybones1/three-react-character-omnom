import { Euler, Vector3 } from "three";

const __tempVec = new Vector3();

export function translateAtEuler(pos: Vector3, euler: Euler, x = 0, y = 0, z = 0) {
  __tempVec.set(x, y, z).applyEuler(euler);
  pos.add(__tempVec);
}
