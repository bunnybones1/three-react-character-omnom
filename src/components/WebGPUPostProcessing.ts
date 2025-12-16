import * as THREE from "three/webgpu";
import {
  pass,
  mrt,
  output,
  normalView,
  metalness,
  blendColor,
  roughness,
  uniform,
  renderGroup,
  uv,
  vec3,
  vec4,
  float,
  dot,
  pow,
  clamp,
  time,
  interleavedGradientNoise,
  getViewPosition,
  getScreenPosition,
  vec2,
} from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { ssr } from "three/addons/tsl/display/SSRNode.js";
import { smaa } from "three/addons/tsl/display/SMAANode.js";
import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";

export function WebGPUPostProcessing({
  strength = 2.5,
  radius = 0.5,
  quality = "default",
  waterHeight = -0.25,
  reflectionOpacity = 1,
  waterNormalStrength = 0.08,
  waterNormalScale = 0.35,
  waterNormalSpeed = 0.15,
  waterDistortionStrength = 0.05,
}) {
  const { gl, scene, camera, size } = useThree();
  const myRenderer = gl as unknown as THREE.WebGPURenderer;
  const myCamera = camera as THREE.PerspectiveCamera;
  const postProcessingRef = useRef<THREE.PostProcessing>(null);
  const reflectionCameraRef = useRef<THREE.PerspectiveCamera>(null);
  const cameraBelowWaterRef = useRef(0);
  const reflectionScratchRef = useRef({
    mainPos: new THREE.Vector3(),
    mainDir: new THREE.Vector3(),
    mainUp: new THREE.Vector3(),
    target: new THREE.Vector3(),
    reflPos: new THREE.Vector3(),
    reflTarget: new THREE.Vector3(),
    reflUp: new THREE.Vector3(),
    quat: new THREE.Quaternion(),
  });

  useEffect(() => {
    if (!myRenderer || !scene || !camera) return;

    // Create post-processing setup with specific filters
    const scenePass = pass(scene, camera, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });

    // Setup Multiple Render Targets (MRT)
    scenePass.setMRT(
      mrt({
        output: output,
        normal: normalView,
        metalrough: vec2(metalness, roughness),
      }),
    );

    // Get texture nodes
    const scenePassColor = scenePass.getTextureNode("output");
    const scenePassNormal = scenePass.getTextureNode("normal");
    const scenePassDepth = scenePass.getTextureNode("depth");
    const scenePassMetalRough = scenePass.getTextureNode("metalrough");

    // Create SSR pass
    const ssrPass = ssr(
      scenePassColor,
      scenePassDepth,
      scenePassNormal,
      scenePassMetalRough.r,
      scenePassMetalRough.g,
      camera,
    );
    ssrPass.resolutionScale = 1;
    ssrPass.maxDistance.value = 5;
    ssrPass.opacity.value = 1;
    ssrPass.thickness.value = 0.05;

    const reflectionCamera = myCamera.clone();
    reflectionCameraRef.current = reflectionCamera;

    const reflectionPass = pass(scene, reflectionCamera, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
    const reflectionPassColor = reflectionPass.getTextureNode("output");
    const reflectionPassDepth = reflectionPass.getTextureNode("depth");

    const reflectionClippingGroup = new THREE.ClippingGroup();
    reflectionClippingGroup.enabled = true;
    reflectionClippingGroup.clippingPlanes = [
      new THREE.Plane(new THREE.Vector3(0, 1, 0), -waterHeight),
    ];

    const reflectionPassUpdateBefore = reflectionPass.updateBefore.bind(reflectionPass);
    reflectionPass.updateBefore = (frame) => {
      const clipPlane = reflectionClippingGroup.clippingPlanes[0];
      const isCameraBelowWater = cameraBelowWaterRef.current > 0.5;

      if (isCameraBelowWater) {
        clipPlane.normal.set(0, -1, 0);
        clipPlane.constant = waterHeight;
      } else {
        clipPlane.normal.set(0, 1, 0);
        clipPlane.constant = -waterHeight;
      }

      const originalChildren = scene.children.filter((child) => child !== reflectionClippingGroup);

      scene.add(reflectionClippingGroup);
      for (const child of originalChildren) reflectionClippingGroup.add(child);

      try {
        reflectionPassUpdateBefore(frame);
      } finally {
        for (const child of originalChildren) scene.add(child);
        scene.remove(reflectionClippingGroup);
      }
    };

    const mainCameraWorldMatrix = uniform("mat4")
      .setName("mainCameraWorldMatrix")
      .setGroup(renderGroup)
      .onRenderUpdate(() => camera.matrixWorld);
    const mainCameraProjectionMatrixInverse = uniform("mat4")
      .setName("mainCameraProjectionMatrixInverse")
      .setGroup(renderGroup)
      .onRenderUpdate(() => camera.projectionMatrixInverse);

    const reflectionViewMatrix = uniform("mat4")
      .setName("reflectionViewMatrix")
      .setGroup(renderGroup)
      .onRenderUpdate(() => reflectionCamera.matrixWorldInverse);
    const reflectionProjectionMatrix = uniform("mat4")
      .setName("reflectionProjectionMatrix")
      .setGroup(renderGroup)
      .onRenderUpdate(() => reflectionCamera.projectionMatrix);
    const reflectionProjectionMatrixInverse = uniform("mat4")
      .setName("reflectionProjectionMatrixInverse")
      .setGroup(renderGroup)
      .onRenderUpdate(() => reflectionCamera.projectionMatrixInverse);
    const reflectionCameraWorldMatrix = uniform("mat4")
      .setName("reflectionCameraWorldMatrix")
      .setGroup(renderGroup)
      .onRenderUpdate(() => reflectionCamera.matrixWorld);

    const waterHeightNode = uniform(waterHeight)
      .setName("waterHeight")
      .setGroup(renderGroup)
      .onRenderUpdate(() => waterHeight);
    const reflectionOpacityNode = uniform(reflectionOpacity)
      .setName("reflectionOpacity")
      .setGroup(renderGroup)
      .onRenderUpdate(() => reflectionOpacity);
    const waterNormalStrengthNode = uniform(waterNormalStrength)
      .setName("waterNormalStrength")
      .setGroup(renderGroup)
      .onRenderUpdate(() => waterNormalStrength);
    const waterNormalScaleNode = uniform(waterNormalScale)
      .setName("waterNormalScale")
      .setGroup(renderGroup)
      .onRenderUpdate(() => waterNormalScale);
    const waterNormalSpeedNode = uniform(waterNormalSpeed)
      .setName("waterNormalSpeed")
      .setGroup(renderGroup)
      .onRenderUpdate(() => waterNormalSpeed);
    const waterDistortionStrengthNode = uniform(waterDistortionStrength)
      .setName("waterDistortionStrength")
      .setGroup(renderGroup)
      .onRenderUpdate(() => waterDistortionStrength);
    const cameraBelowWaterNode = uniform(0)
      .setName("cameraBelowWater")
      .setGroup(renderGroup)
      .onRenderUpdate(() => cameraBelowWaterRef.current);

    const screenUV = uv();
    const depth01 = scenePassDepth.sample(screenUV).r;
    const viewPosition = getViewPosition(screenUV, depth01, mainCameraProjectionMatrixInverse);
    const worldPosition = mainCameraWorldMatrix.mul(vec4(viewPosition, 1)).xyz;

    const isCameraBelowWaterNode = cameraBelowWaterNode.greaterThan(float(0.5));
    const waterMaskBase = worldPosition.y.lessThan(waterHeightNode).select(float(1), float(0));
    const waterMask = isCameraBelowWaterNode.select(waterMaskBase.oneMinus(), waterMaskBase);

    const waterBaseNormalY = isCameraBelowWaterNode.select(float(-1), float(1));
    const waterNoiseUV = vec2(worldPosition.x, worldPosition.z)
      .mul(waterNormalScaleNode)
      .add(vec2(time.mul(waterNormalSpeedNode), time.mul(waterNormalSpeedNode).mul(float(0.73))));
    const waterNoiseX = interleavedGradientNoise(waterNoiseUV).mul(float(2)).sub(float(1));
    const waterNoiseZ = interleavedGradientNoise(waterNoiseUV.add(vec2(float(17.3), float(29.7))))
      .mul(float(2))
      .sub(float(1));
    const waterNormalAnimated = vec3(
      waterNoiseX.mul(waterNormalStrengthNode),
      waterBaseNormalY,
      waterNoiseZ.mul(waterNormalStrengthNode),
    ).normalize();
    const waterDistortion = vec2(waterNormalAnimated.x, waterNormalAnimated.z)
      .mul(waterDistortionStrengthNode)
      .mul(waterMask);

    const reflectedWorldPosition = vec3(
      worldPosition.x,
      waterHeightNode.mul(float(2)).sub(worldPosition.y),
      worldPosition.z,
    );
    const reflectionViewPosition = reflectionViewMatrix.mul(vec4(reflectedWorldPosition, 1)).xyz;
    const reflectionUV = getScreenPosition(reflectionViewPosition, reflectionProjectionMatrix);
    const reflectionUVDistorted = reflectionUV.add(waterDistortion);
    const reflectionSample = reflectionPassColor.sample(reflectionUVDistorted);
    const reflectionDepth01 = reflectionPassDepth.sample(reflectionUVDistorted).r;
    const reflectionSampleViewPosition = getViewPosition(
      reflectionUVDistorted,
      reflectionDepth01,
      reflectionProjectionMatrixInverse,
    );
    const reflectionSampleWorldPosition = reflectionCameraWorldMatrix.mul(
      vec4(reflectionSampleViewPosition, 1),
    ).xyz;
    const reflectionAboveWaterMaskBase = reflectionSampleWorldPosition.y
      .greaterThan(waterHeightNode)
      .select(float(1), float(0));
    const reflectionAboveWaterMask = isCameraBelowWaterNode.select(
      reflectionAboveWaterMaskBase.oneMinus(),
      reflectionAboveWaterMaskBase,
    );
    const reflectionMask = waterMask.mul(reflectionAboveWaterMask);

    const waterNormal = vec3(0, waterBaseNormalY, 0);
    const viewRayDirView = getViewPosition(
      screenUV,
      float(1),
      mainCameraProjectionMatrixInverse,
    ).normalize();
    const viewRayDirWorld = mainCameraWorldMatrix.mul(vec4(viewRayDirView, 0)).xyz.normalize();
    const cosTheta = clamp(dot(waterNormal, viewRayDirWorld.negate()), float(0), float(1));
    const f0 = float(0.02037);
    const fresnel = f0.add(
      float(1)
        .sub(f0)
        .mul(pow(float(1).sub(cosTheta), float(5))),
    );

    const sceneUVDistorted = screenUV.sub(waterDistortion);
    const scenePassColorDistorted = scenePassColor.sample(sceneUVDistorted);

    const reflectionOverlay = vec4(
      reflectionSample.rgb.mul(reflectionMask),
      reflectionMask.mul(reflectionOpacityNode).mul(fresnel),
    );

    const baseColor = blendColor(scenePassColorDistorted, ssrPass);
    // const compositeColor = reflectionOverlay;
    const compositeColor = blendColor(baseColor, reflectionOverlay);
    const bloomPass = bloom(compositeColor, strength, radius, 0.6);
    const crispNode = smaa(compositeColor.add(bloomPass));

    // Setup post-processing
    const postProcessing = new THREE.PostProcessing(myRenderer);
    postProcessing.outputNode = crispNode;
    postProcessingRef.current = postProcessing;

    // Handle window resize

    // if (postProcessingRef.current.setSize) {
    //   postProcessingRef.current.setSize(size.width, size.height);
    //   postProcessingRef.current.needsUpdate = true;
    // }

    return () => {
      postProcessingRef.current = null;
      reflectionCameraRef.current = null;
    };
  }, [
    scene,
    camera,
    size,
    strength,
    radius,
    quality,
    waterHeight,
    reflectionOpacity,
    waterNormalStrength,
    waterNormalScale,
    waterNormalSpeed,
    waterDistortionStrength,
    myCamera,
    myRenderer,
  ]);

  useFrame(({ gl, scene, camera }) => {
    void scene;
    const reflectionCamera = reflectionCameraRef.current;
    if (reflectionCamera) {
      const scratch = reflectionScratchRef.current;
      camera.updateMatrixWorld(true);

      camera.getWorldPosition(scratch.mainPos);
      cameraBelowWaterRef.current = scratch.mainPos.y < waterHeight ? 1 : 0;
      camera.getWorldDirection(scratch.mainDir);
      camera.getWorldQuaternion(scratch.quat);
      scratch.mainUp.set(0, 1, 0).applyQuaternion(scratch.quat);
      scratch.target.copy(scratch.mainPos).add(scratch.mainDir);

      scratch.reflPos.copy(scratch.mainPos);
      scratch.reflPos.y = 2 * waterHeight - scratch.mainPos.y;
      scratch.reflTarget.copy(scratch.target);
      scratch.reflTarget.y = 2 * waterHeight - scratch.target.y;
      scratch.reflUp.copy(scratch.mainUp);
      scratch.reflUp.y = -scratch.mainUp.y;

      reflectionCamera.position.copy(scratch.reflPos);
      reflectionCamera.up.copy(scratch.reflUp);
      reflectionCamera.lookAt(scratch.reflTarget);
      reflectionCamera.updateMatrixWorld(true);
      reflectionCamera.projectionMatrix.copy(camera.projectionMatrix);
      reflectionCamera.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    }

    if (postProcessingRef.current) {
      gl.clear();
      postProcessingRef.current.render();
    }
  }, 1);

  return null;
}
