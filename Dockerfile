FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm@9

COPY pnpm-workspace.yaml package.json tsconfig.base.json tsconfig.json ./
COPY scripts/package.json scripts/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY scripts/ scripts/

CMD ["pnpm", "--filter", "@workspace/scripts", "run", "discord-bot"]
