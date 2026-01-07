import { Object3D } from "three";
import { FootHopper, FootHopperConfig } from "./FootHopper";

export type FeetManagerConfig = {
  scale?: number;
  floorHeight?: number;
  left?: FootHopperConfig;
  right?: FootHopperConfig;
};

export class FeetManager {
  left: FootHopper;
  right: FootHopper;
  L: FootHopper;
  R: FootHopper;

  constructor(config: FeetManagerConfig = {}) {
    const leftConfig = config.left ?? {};
    const rightConfig = config.right ?? {};
    const scale = config.scale;
    const floorHeight = config.floorHeight;
    this.left = new FootHopper({
      ...leftConfig,
      scale: leftConfig.scale ?? scale,
      floorHeight: leftConfig.floorHeight ?? floorHeight,
    });
    this.right = new FootHopper({
      ...rightConfig,
      scale: rightConfig.scale ?? scale,
      floorHeight: rightConfig.floorHeight ?? floorHeight,
    });
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
