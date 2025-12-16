import { Float } from "@react-three/drei";
import type { Vec3 } from "./types";

export default function GlowyBall(props: { position: Vec3 }) {
  const { position } = props;
  return (
    <Float speed={20} floatIntensity={2} rotationIntensity={0.3}>
      <mesh castShadow position={position}>
        <sphereGeometry args={[0.2]} />
        <meshStandardNodeMaterial
          color={0xffffff}
          roughness={0.1}
          emissive={0xffffff}
          emissiveIntensity={20}
        />
      </mesh>
    </Float>
  );
}
