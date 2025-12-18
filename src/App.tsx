import { useMemo } from "react";
import { Environment } from "./components/Environment";
import { MyCanvas } from "./components/MyCanvas";
import { RepeatWrapping, TextureLoader } from "three";
import { AnimatedMonsters } from "./AnimatedMonsters";

export default function App() {
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
      <MyCanvas quality={"default"}>
        <color attach="background" args={["#557799"]} />

        <Environment />

        <mesh castShadow receiveShadow position={[0, -1, 0]}>
          <cylinderGeometry args={[30, 25, 4, 32, 2, true]} />
          <meshStandardNodeMaterial
            side={2}
            normalMap={floorTexture}
            color={0xaaaaaa}
            roughness={0.3}
            metalness={0.75}
          />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 0, 0]} rotation={[Math.PI * -0.5, 0, 0]}>
          <planeGeometry args={[120, 120]} />
          <meshStandardNodeMaterial
            normalMap={floorTexture}
            color={0xaaaaaa}
            roughness={0.3}
            metalness={0.75}
          />
        </mesh>
        <AnimatedMonsters />
      </MyCanvas>
    </>
  );
}
