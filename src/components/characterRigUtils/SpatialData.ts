import { Euler, Vector3 } from "three";

const __tempVec = new Vector3();

export class SpatialData {
  constructor(
    public position = new Vector3(),
    public rotation = new Euler(),
  ) {}

  translate(x: number, y: number, z: number) {
    __tempVec.set(x, y, z).applyEuler(this.rotation);
    this.position.add(__tempVec);
    return this;
  }
}
