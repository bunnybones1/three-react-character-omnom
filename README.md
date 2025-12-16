# React Three Fiber WebGPU Post Processing

[![screenshot](https://r3f-webgpu-starter.dysinski-tomasz.workers.dev/social.jpg)](https://r3f-webgpu-starter.dysinski-tomasz.workers.dev/)

A very simple scene to demonstrate how to integrate Threejs WebGPU with React Three Fiber using Post Processing effects.
[See the demo here](https://r3f-webgpu-starter.dysinski-tomasz.workers.dev/)

### Getting Started using this demo project

Download and install Node.js on your computer (https://nodejs.org/en/download/).

Then, open VSCODE, drag the project folder to it. Open VSCODE terminal and install dependencies (you need to do this only in the first time)

```shell
pnpm install
```

Run this command in your terminal to open a local server at localhost:5173

```shell
pnpm dev
```

## Deploy to Cloudflare Workers (static hosting)

This repo can be deployed as a Cloudflare Worker that serves the Vite build output from `dist/`.

```shell
pnpm install
pnpm deploy
```

If you haven’t authenticated Wrangler yet:

```shell
pnpm exec wrangler login
```

Forked from a fantastic repo by Anderson Mancini.
Please show him your appreciation. Consider buying him a coffee to support his development at https://www.buymeacoffee.com/andersonmancini.