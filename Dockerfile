FROM node:20-alpine as build-stage

WORKDIR /app
COPY client /app/client
COPY server /app/server
COPY manager /app/manager
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /app/
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM fedora:40 as production-stage

RUN dnf install -y nodejs npm caddy pnpm

WORKDIR /app

COPY --from=build-stage /app/server /app/server
COPY --from=build-stage /app/client/dist /app/client/dist
COPY --from=build-stage /app/manager /app/manager
COPY --from=build-stage /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/
COPY Caddyfile /app/Caddyfile

WORKDIR /app/server
RUN pnpm install --frozen-lockfile

WORKDIR /app/manager
RUN pnpm install --frozen-lockfile

WORKDIR /app
CMD ["caddy", "run"]
WORKDIR /app/manager
CMD ["pnpm", "start"]