import { useFrame } from "@react-three/fiber";
import { useState } from "react";
import Eye from "./Eye";
import type { Eul, Vec3 } from "./types";

export default function Monster(props: { position: Vec3; rotation: Eul; color: number }) {
  const { position, rotation, color } = props;
  const [offsetY, setOffsetY] = useState(0);
  const [eyesClosed, setEyesClosed] = useState(0);

  const [offsetYPhase] = useState(() => Math.random() * Math.PI * 2);
  useFrame((state, _dt) => {
    setOffsetY(Math.sin(6 * state.clock.elapsedTime + offsetYPhase) * 0.05 + 1);
    setEyesClosed(Math.max(0, Math.min(1, Math.sin(state.clock.elapsedTime) * 10 - 8)));
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow position={[0, offsetY, 0]}>
        <sphereGeometry args={[0.6]} />
        <meshStandardNodeMaterial color={color} roughness={0.5} />
        <mesh castShadow receiveShadow position={[-0.2, 0, -0.8]} rotation={[1, 0, 0]}>
          <capsuleGeometry args={[0.15, 1.4]} />
          <meshStandardNodeMaterial color={color} roughness={0.1} side={2} />
        </mesh>{" "}
        <mesh castShadow receiveShadow position={[-0.2, 0, 0.8]} rotation={[-1, 0, 0]}>
          <capsuleGeometry args={[0.15, 1.4]} />
          <meshStandardNodeMaterial color={color} roughness={0.1} side={2} />
        </mesh>
        <group position={[0, 1.2, 0]}>
          <mesh castShadow receiveShadow rotation={[Math.PI * 0.5, 2.8, 0]}>
            <sphereGeometry args={[1, 32, 16, 0, Math.PI * 1.9]} />
            <meshStandardNodeMaterial color={color} roughness={0.1} side={2} />
          </mesh>
          <Eye position={[0.7, 0.2, 0.5]} color={color} closed={eyesClosed} />
          <Eye position={[0.7, 0.2, -0.5]} color={color} closed={eyesClosed} />
        </group>
      </mesh>
      <mesh castShadow receiveShadow position={[0, -0.1, 0.3]} rotation={[0, 0, 0]}>
        <capsuleGeometry args={[0.15, 1.4]} />
        <meshStandardNodeMaterial color={color} roughness={0.1} side={2} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -0.1, -0.3]} rotation={[0, 0, 0]}>
        <capsuleGeometry args={[0.15, 1.4]} />
        <meshStandardNodeMaterial color={color} roughness={0.1} side={2} />
      </mesh>
    </group>
  );
}
