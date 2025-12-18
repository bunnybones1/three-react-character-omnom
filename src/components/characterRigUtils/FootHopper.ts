import { Euler, Object3D, Plane, Quaternion, Vector3 } from "three";
import { SpatialData } from "./SpatialData";

export type FootHopperState = "planted" | "moving";

export type FootHopperConfig = {
  footOffset?: Vector3;
  maxLegDistance?: number;
  maxLegIdle?: number;
  predictionTime?: number;
  hopDuration?: number;
  hopHeight?: number;
  velocitySmoothing?: number;
};

const DEFAULT_FOOT_OFFSET = new Vector3(0, -2, 0);
const DEFAULT_CONFIG = {
  footOffset: DEFAULT_FOOT_OFFSET,
  maxLegDistance: 2.2,
  maxLegIdle: 3,
  predictionTime: 0.25,
  hopDuration: 0.26,
  hopHeight: 1.25,
  velocitySmoothing: 0.2,
};
const GROUND_PLANE = new Plane(new Vector3(0, 1, 0), -0.5);

export class FootHopper {
  desired = new SpatialData();
  actual = new SpatialData();
  state: FootHopperState = "planted";

  private config: Required<FootHopperConfig>;
  private maxLegDistanceSq: number;
  private lastHipPosition = new Vector3();
  private hipVelocity = new Vector3();
  private hasVelocity = false;
  private initialized = false;
  idleTime = Math.random() * 2;

  private moveTime = 0;
  private start = new SpatialData();
  private target = new SpatialData();

  private hipWorld = new Vector3();
  private footWorld = new Vector3();
  private predictedHipWorld = new Vector3();
  private desiredWorld = new Vector3();
  private tempQuat = new Quaternion();
  private tempVec = new Vector3();
  private tempVec2 = new Vector3();
  private tempOffset = new Vector3();

  constructor(config: FootHopperConfig = {}) {
    const { ...defaultConfig } = DEFAULT_CONFIG;
    const {
      footOffset,
      maxLegDistance,
      maxLegIdle,
      predictionTime,
      hopDuration,
      hopHeight,
      velocitySmoothing,
    } = { ...defaultConfig, ...config };
    const resolvedFootOffset = (footOffset ?? defaultConfig.footOffset).clone();
    const resolvedMaxLegDistance = maxLegDistance ?? defaultConfig.maxLegDistance;
    const resolvedPredictionTime = predictionTime ?? defaultConfig.predictionTime;
    const resolvedHopHeight = hopHeight ?? defaultConfig.hopHeight;
    const safeHopDuration = Math.max(0.001, hopDuration ?? defaultConfig.hopDuration);
    const safeMaxLegIdle = Math.max(0, maxLegIdle ?? defaultConfig.maxLegIdle);
    const safeVelocitySmoothing = Math.min(
      1,
      Math.max(0, velocitySmoothing ?? defaultConfig.velocitySmoothing),
    );
    this.config = {
      footOffset: resolvedFootOffset,
      maxLegDistance: resolvedMaxLegDistance,
      maxLegIdle: safeMaxLegIdle,
      predictionTime: resolvedPredictionTime,
      hopDuration: safeHopDuration,
      hopHeight: resolvedHopHeight,
      velocitySmoothing: safeVelocitySmoothing,
    };
    this.maxLegDistanceSq = resolvedMaxLegDistance * resolvedMaxLegDistance;
  }

  plant(position: Vector3, rotation?: Euler) {
    this.actual.position.copy(position);
    if (rotation) {
      this.actual.rotation.copy(rotation);
    }
    this.state = "planted";
    this.moveTime = 0;
    this.idleTime = Math.random() * 0.1;
    this.start.position.copy(this.actual.position);
    this.start.rotation.copy(this.actual.rotation);
    this.target.position.copy(this.actual.position);
    this.target.rotation.copy(this.actual.rotation);
  }

  update(hip: Object3D, delta: number) {
    const rigRoot = hip.parent ?? hip;
    rigRoot.updateMatrixWorld(true);
    hip.getWorldPosition(this.hipWorld);
    hip.getWorldQuaternion(this.tempQuat);

    if (!this.initialized) {
      this.lastHipPosition.copy(this.hipWorld);
      this.initialized = true;
      if (
        this.actual.position.lengthSq() === 0 &&
        this.actual.rotation.x === 0 &&
        this.actual.rotation.y === 0 &&
        this.actual.rotation.z === 0
      ) {
        this.tempOffset.copy(this.config.footOffset).applyQuaternion(this.tempQuat);
        this.desiredWorld.copy(this.hipWorld).add(this.tempOffset);
        GROUND_PLANE.projectPoint(this.desiredWorld, this.desiredWorld);
        this.actual.position.copy(this.desiredWorld);
        rigRoot.worldToLocal(this.actual.position);
        this.actual.rotation.copy(hip.rotation);
      }
    }

    if (delta > 0) {
      const frameVelocity = this.tempVec
        .copy(this.hipWorld)
        .sub(this.lastHipPosition)
        .multiplyScalar(1 / delta);
      if (!this.hasVelocity) {
        this.hipVelocity.copy(frameVelocity);
        this.hasVelocity = true;
      } else {
        this.hipVelocity.lerp(frameVelocity, this.config.velocitySmoothing);
      }
      this.lastHipPosition.copy(this.hipWorld);
    } else {
      this.lastHipPosition.copy(this.hipWorld);
    }

    this.predictedHipWorld
      .copy(this.hipVelocity)
      .multiplyScalar(this.config.predictionTime)
      .add(this.hipWorld);
    this.tempOffset.copy(this.config.footOffset).applyQuaternion(this.tempQuat);
    this.desired.rotation.copy(hip.rotation);

    this.footWorld.copy(this.actual.position);
    rigRoot.localToWorld(this.footWorld);
    const hipToFootPlanar = this.tempVec2.subVectors(this.footWorld, this.hipWorld);
    hipToFootPlanar.y = 0;
    const hipToFootPlanarSq = hipToFootPlanar.lengthSq();
    const outOfRange = hipToFootPlanarSq > this.maxLegDistanceSq;
    if (this.state === "planted") {
      this.idleTime += Math.max(0, delta);
    } else {
      this.idleTime = 0;
    }
    const needsHop = outOfRange || this.idleTime >= this.config.maxLegIdle;

    if (outOfRange && hipToFootPlanarSq > 0) {
      hipToFootPlanar.multiplyScalar(-0.8);
      this.desiredWorld.copy(this.predictedHipWorld).add(hipToFootPlanar);
    } else {
      this.desiredWorld.copy(this.predictedHipWorld).add(this.tempOffset);
    }
    GROUND_PLANE.projectPoint(this.desiredWorld, this.desiredWorld);
    this.desired.position.copy(this.desiredWorld);
    rigRoot.worldToLocal(this.desired.position);

    if (this.state === "planted" && needsHop) {
      this.state = "moving";
      this.moveTime = 0;
      this.idleTime = 0;
      this.start.position.copy(this.actual.position);
      this.start.rotation.copy(this.actual.rotation);
      this.target.position.copy(this.desired.position);
      this.target.rotation.copy(this.desired.rotation);
    }

    if (this.state === "moving") {
      this.moveTime += Math.max(0, delta);
      const t = Math.min(1, this.moveTime / this.config.hopDuration);
      const eased = t * t * (3 - 2 * t);
      this.actual.position.lerpVectors(this.start.position, this.target.position, eased);
      this.actual.position.y += Math.sin(Math.PI * t) * this.config.hopHeight;
      this.actual.rotation.set(
        this.start.rotation.x + (this.target.rotation.x - this.start.rotation.x) * eased,
        this.start.rotation.y + (this.target.rotation.y - this.start.rotation.y) * eased,
        this.start.rotation.z + (this.target.rotation.z - this.start.rotation.z) * eased,
        this.start.rotation.order,
      );
      this.desired.position.copy(this.target.position);
      this.desired.rotation.copy(this.target.rotation);
      if (t >= 1) {
        this.state = "planted";
        this.idleTime = 0;
        this.actual.position.copy(this.target.position);
        this.actual.rotation.copy(this.target.rotation);
      }
    }
  }
}
