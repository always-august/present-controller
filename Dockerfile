FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOST=0.0.0.0 PORT=3000 DATA_DIR=/data
# 방 스냅샷(SQLite)은 볼륨에 둔다. Railway/Fly에서 /data 를 마운트하면 재배포해도 유지됨.
# Railway 볼륨은 root 소유로 마운트되므로 컨테이너는 root로 돈다 (RAILWAY_RUN_UID=0)
RUN mkdir -p /data
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared
COPY --from=build /app/next.config.ts /app/tsconfig.json ./
EXPOSE 3000
CMD ["npx", "tsx", "server/index.ts"]
