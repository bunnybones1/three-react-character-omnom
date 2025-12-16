import { Vec3 } from "./types";

export default function Eye(props: { position: Vec3; color: number; closed: number }) {
  const { position, color, closed } = props;
  return (
    <>
      <mesh castShadow position={position} rotation={[0, 0, Math.PI * -0.5]}>
        <sphereGeometry args={[0.3]} />
        <meshStandardNodeMaterial color={0xffffff} roughness={0.5} />
        <mesh castShadow position={[0, 0.125, 0]}>
          <sphereGeometry args={[0.2]} />
          <meshStandardNodeMaterial color={0x000000} roughness={0.1} />
        </mesh>

        <mesh castShadow rotation={[Math.PI * -0.5, -2 + closed, 0]}>
          <sphereGeometry args={[0.35, 32, 16, 0, Math.PI]} />
          <meshStandardNodeMaterial color={color} roughness={0.5} />
        </mesh>
        <mesh castShadow rotation={[Math.PI * -0.5, 2.5 - closed * 0.3, 0]}>
          <sphereGeometry args={[0.35, 32, 16, 0, Math.PI]} />
          <meshStandardNodeMaterial color={color} roughness={0.5} />
        </mesh>
      </mesh>
    </>
  );
}
