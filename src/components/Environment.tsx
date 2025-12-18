import { OrbitControls } from "@react-three/drei";

const shaddowRange = 10;

export function Environment() {
  return (
    <>
      <directionalLight
        position={[7, 10, 5]}
        intensity={6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.01}
        shadow-camera-far={100}
        shadow-camera-top={shaddowRange}
        shadow-camera-right={shaddowRange}
        shadow-camera-bottom={-shaddowRange}
        shadow-camera-left={-shaddowRange}
        shadow-bias={-0.002}
      />
      <ambientLight color={0xaabbff} intensity={5} />
      <OrbitControls
        target={[0, 0.5, 0]}
        // zoomSpeed={0.8}
        screenSpacePanning={true}
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 1.75}
        minPolarAngle={0}
        maxDistance={15}
        minDistance={2}
        minZoom={0.5}
        maxZoom={1}
      />
      {/* <DreiEnvironment
        preset="warehouse"
        environmentIntensity={0.2}
        environmentRotation={[0.4, 0, 1.4]}
      /> */}
    </>
  );
}
