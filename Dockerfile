FROM node:18-alpine as build-stage

WORKDIR /app
RUN corepack enable

COPY client /app/client
COPY server /app/server
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /app/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:18-alpine as production-stage

WORKDIR /app
RUN corepack enable

COPY --from=build-stage /app/server /app/server
COPY --from=build-stage /app/client/dist /app/client/dist
COPY --from=build-stage /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/

RUN pnpm install --frozen-lockfile --filter=server

EXPOSE 3000

CMD ["pnpm", "start"]
