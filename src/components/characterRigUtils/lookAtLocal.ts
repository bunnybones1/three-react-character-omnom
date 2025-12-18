import { Vector3, Quaternion, Matrix4, Object3D } from "three";

const lookDirection = new Vector3();
const lookRightDirection = new Vector3();
const lookRightProjected = new Vector3();
const localRightProjected = new Vector3();
const lookUpDirection = new Vector3();
const lookTemp = new Vector3();
const lookQuaternion = new Quaternion();
const lookMatrix = new Matrix4();
const localBasis = new Matrix4();
const localBasisInverse = new Matrix4();
const localForward = new Vector3();
const localRight = new Vector3();
const localUp = new Vector3();
export const lookAtLocal = (
  object: Object3D,
  target: Vector3,
  lookForward: Vector3,
  lookRight: Vector3,
  rightTarget?: Vector3,
) => {
  lookDirection.copy(target).sub(object.position);
  if (lookDirection.lengthSq() === 0) {
    return;
  }
  lookDirection.normalize();

  localForward.copy(lookForward);
  if (localForward.lengthSq() === 0) {
    return;
  }
  localForward.normalize();

  if (!rightTarget) {
    lookQuaternion.setFromUnitVectors(localForward, lookDirection);
    object.quaternion.copy(lookQuaternion);
    return;
  }

  lookRightDirection.copy(rightTarget).sub(object.position);
  if (lookRightDirection.lengthSq() === 0) {
    lookQuaternion.setFromUnitVectors(localForward, lookDirection);
    object.quaternion.copy(lookQuaternion);
    return;
  }
  lookRightDirection.normalize();

  lookRightProjected
    .copy(lookRightDirection)
    .sub(lookTemp.copy(lookDirection).multiplyScalar(lookRightDirection.dot(lookDirection)));
  if (lookRightProjected.lengthSq() === 0) {
    lookQuaternion.setFromUnitVectors(localForward, lookDirection);
    object.quaternion.copy(lookQuaternion);
    return;
  }
  lookRightProjected.normalize();

  localRight.copy(lookRight);
  if (localRight.lengthSq() === 0) {
    lookQuaternion.setFromUnitVectors(localForward, lookDirection);
    object.quaternion.copy(lookQuaternion);
    return;
  }
  localRight.normalize();

  localRightProjected
    .copy(localRight)
    .sub(lookTemp.copy(localForward).multiplyScalar(localRight.dot(localForward)));
  if (localRightProjected.lengthSq() === 0) {
    lookQuaternion.setFromUnitVectors(localForward, lookDirection);
    object.quaternion.copy(lookQuaternion);
    return;
  }
  localRightProjected.normalize();

  localUp.crossVectors(localForward, localRightProjected);
  if (localUp.lengthSq() === 0) {
    lookQuaternion.setFromUnitVectors(localForward, lookDirection);
    object.quaternion.copy(lookQuaternion);
    return;
  }
  localUp.normalize();

  lookUpDirection.crossVectors(lookDirection, lookRightProjected);
  if (lookUpDirection.lengthSq() === 0) {
    lookQuaternion.setFromUnitVectors(localForward, lookDirection);
    object.quaternion.copy(lookQuaternion);
    return;
  }
  lookUpDirection.normalize();

  lookMatrix.makeBasis(lookRightProjected, lookUpDirection, lookDirection);
  localBasis.makeBasis(localRightProjected, localUp, localForward);
  localBasisInverse.copy(localBasis).invert();
  lookMatrix.multiply(localBasisInverse);
  lookQuaternion.setFromRotationMatrix(lookMatrix);
  object.quaternion.copy(lookQuaternion);
};
