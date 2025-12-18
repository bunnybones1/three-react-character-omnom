import { Object3D } from "three";
import { FootHopper, FootHopperConfig } from "./FootHopper";

export type FeetManagerConfig = {
  left?: FootHopperConfig;
  right?: FootHopperConfig;
};

export class FeetManager {
  left: FootHopper;
  right: FootHopper;
  L: FootHopper;
  R: FootHopper;

  constructor(config: FeetManagerConfig = {}) {
    this.left = new FootHopper(config.left);
    this.right = new FootHopper(config.right);
    this.L = this.left;
    this.R = this.right;
  }

  update(hipLeft: Object3D, hipRight: Object3D, delta: number) {
    let leftDelta = delta;
    let rightDelta = delta;
    const idleDiff = Math.abs(this.left.idleTime - this.right.idleTime);
    if (idleDiff <= 1.25) {
      if (this.left.idleTime < this.right.idleTime) {
        leftDelta *= 0.5;
      } else if (this.right.idleTime < this.left.idleTime) {
        rightDelta *= 0.5;
      }
    }
    this.left.update(hipLeft, leftDelta);
    this.right.update(hipRight, rightDelta);
  }
}
