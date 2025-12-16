import { useMemo, useState } from "react";
import { WebGPUPostProcessing } from "./components/WebGPUPostProcessing";
import { Overlay } from "./components/Overlay";
import { Environment } from "./components/Environment";
import { MyCanvas } from "./components/MyCanvas";
import { RepeatWrapping, TextureLoader } from "three";
import Monster from "./components/Monster";
import { Float } from "@react-three/drei";
import GlowyBall from "./components/GlowyBall";
import type { Quality } from "./types";

export default function App() {
  const [quality, setQuality] = useState<Quality>("default");
  const [isPostProcessingEnabled, setIsPostProcessingEnabled] = useState(true);
  // Disable frameloop by default, waiting for WebGPU to be ready

  const floorTexture = useMemo(() => {
    const loader = new TextureLoader();

    const floorNormal = loader.load("FloorsCheckerboard_S_Normal.jpg");
    floorNormal.wrapS = RepeatWrapping;
    floorNormal.wrapT = RepeatWrapping;

    return floorNormal;
  }, []);

  return (
    <>
      <Overlay
        isPostProcessingEnabled={isPostProcessingEnabled}
        setIsPostProcessingEnabled={setIsPostProcessingEnabled}
        setQuality={setQuality}
        quality={quality}
      />

      {/* <Loader /> */}

      <MyCanvas quality={quality}>
        <color attach="background" args={["#557799"]} />

        {isPostProcessingEnabled && (
          <WebGPUPostProcessing strength={0.25} radius={0.1} quality={quality} />
        )}

        <Environment />

        <mesh castShadow receiveShadow position={[0, -1, 0]}>
          <cylinderGeometry args={[10, 5, 4, 32, 2, true]} />
          <meshStandardNodeMaterial
            side={2}
            normalMap={floorTexture}
            color={0xaaaaaa}
            roughness={0.3}
            metalness={0.75}
          />
        </mesh>
        <mesh castShadow receiveShadow position={[0, -1, 0]} rotation={[Math.PI * -0.5, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardNodeMaterial
            normalMap={floorTexture}
            color={0xaaaaaa}
            roughness={0.3}
            metalness={0.75}
          />
        </mesh>

        <mesh castShadow receiveShadow position={[0, 2, 2]}>
          <sphereGeometry args={[1]} />
          <meshStandardNodeMaterial color={0xffff00} roughness={0.5} metalness={0.75} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 0, -5]}>
          <sphereGeometry args={[1]} />
          <meshStandardNodeMaterial color={0x00ff00} roughness={0.7} metalness={0.75} />
        </mesh>
        <Float speed={2} floatIntensity={10} rotationIntensity={0.3}>
          <mesh castShadow receiveShadow position={[3, 2, 0]}>
            <sphereGeometry args={[1]} />
            <meshStandardNodeMaterial color={0xffffff} roughness={0.1} metalness={1} />
          </mesh>
        </Float>
        <GlowyBall position={[0.5, 0.9, 0.5]} />
        <GlowyBall position={[4, 2, 4]} />
        <Monster position={[2, 0, 2]} rotation={[0, 1, 0]} color={0xff00ff} />
        <Monster position={[2, 0, -2]} rotation={[0, -1, 0]} color={0x009fff} />
        <Monster position={[-2, 0, -6]} rotation={[0, -1, 0]} color={0x00af00} />
      </MyCanvas>
    </>
  );
}
