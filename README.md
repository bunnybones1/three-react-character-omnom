# Omnom 3D Character for React Three Fiber

[![npm version](https://img.shields.io/npm/v/three-react-character-omnom)](https://www.npmjs.com/package/three-react-character-omnom)

A rigged 3D character component of a monster named Omnom for React Three Fiber, published on npm as `three-react-character-omnom`.

## Install

```shell
npm install three-react-character-omnom
```

## Package usage (Monster)

```tsx
import { Canvas } from "@react-three/fiber";
import { Monster } from "three-react-character-omnom";

export function Scene() {
  return (
    <Canvas>
      <Monster position={[0, 0, 0]} rotation={[0, 0, 0]} />
    </Canvas>
  );
}
```

Pass `modelUrl` if you want to load your own `.glb`. The default uses the bundled model.

### Development

I recommend using pnpm.
Install dependencies:

```shell
pnpm install
```

Run this command in your terminal to open a local server at localhost:5173

```shell
pnpm dev
```

### Building the package

```shell
pnpm build:lib
```
