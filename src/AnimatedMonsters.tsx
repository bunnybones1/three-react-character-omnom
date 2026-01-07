import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { Vector3, Euler } from "three";
import Monster from "./components/Monster";

export type MonsterConfig = {
  color?: number;
  origin: Vector3;
  speed: number;
};

export type MonsterState = {
  position: Vector3;
  rotation: Euler;
  phase: number;
  lookTarget: Vector3;
};

const monsterCount = 7;

export function AnimatedMonsters() {
  const monsters = useMemo<MonsterConfig[]>(
    () =>
      new Array(monsterCount).fill(null).map((_, _index) => {
        return {
          color: undefined,
          origin: new Vector3(Math.random() * 20 - 10, 0, Math.random() * 20 - 10),
          speed: Math.random() * 0.75 + 0.5,
        };
      }),
    [],
  );
  const monsterStates = useMemo<MonsterState[]>(
    () =>
      monsters.map(() => ({
        position: new Vector3(),
        lookTarget: new Vector3(),
        rotation: new Euler(),
        phase: Math.random() * Math.PI * 2,
      })),
    [monsters],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime * 4;
    monsters.forEach((monster, index) => {
      const monsterState = monsterStates[index];
      const tScaled = t * monster.speed;
      monsterState.position.set(
        Math.sin(tScaled * 0.2) * 5 + monster.origin.x,
        Math.sin(tScaled * 6.6 + monsterState.phase) * 0.25 + 0.75 + monster.origin.y,
        Math.sin(tScaled * 0.4) * -2.5 + monster.origin.z,
      );
      monsterState.rotation.set(0, Math.sin(tScaled * 0.4) * -1.5, 0);
      const tTargetScaled = t * monster.speed * 2.3;
      monsterState.lookTarget.set(
        Math.sin(tTargetScaled * 0.2) * 15 + monster.origin.x,
        Math.sin(tTargetScaled * 0.3 + monsterState.phase) * 7.25 + 3.5 + monster.origin.y,
        Math.sin(tTargetScaled * 0.4) * -2.5 + monster.origin.z + 8,
      );
    });
  }, -1);

  return (
    <>
      {monsters.map((monster, index) => (
        <Monster
          key={index}
          color={monster.color}
          position={monsterStates[index].position}
          lookTarget={monsterStates[index].lookTarget}
          rotation={monsterStates[index].rotation}
          markersEnabled={false}
          floorHeight={0.1}
          scale={0.25}
        />
      ))}
    </>
  );
}
