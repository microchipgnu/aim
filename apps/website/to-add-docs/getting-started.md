---
sidebar_position: 2
title: Getting Started
---

## Getting Started

The easiest way to get started is to use the [Starter Project](https://github.com/microchipgnu/aim/tree/main/start-here). This is a project you can self-host and deploy on a server of your choice, making it ideal for serving and executing AIM files.

```markdown
start-here/
├── .env.example          # Template for supported API keys (OpenAI, Replicate, OpenRouter)
├── Dockerfile            # Docker configuration using node:slim
├── examples/             # Example AIM documents
│   ├── hello-world.aim
│   └── wordware/
│       └── tutorial/     # Tutorial examples showing various features
└── run.sh                # Shell script for Docker deployment
```

```bash
npx aimx@latest start
```

As you dive into AIM you'll notice that this project contains an SDK written in TypeScript that includes a [Compiler](/docs/developer-tools/sdk/compiler), a [Server](/docs/developer-tools/sdk/server) and a [Runtime](/docs/developer-tools/sdk/runtime). 

It also contains a [CLI](/docs/developer-tools/cli) that you can use to run, serve or compile your AIM files. The SDK is the first implementation of the SDK.