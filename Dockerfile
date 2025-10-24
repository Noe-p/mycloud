
# 1 – Installer les dépendances avec Bun
FROM oven/bun:1 AS dependencies
WORKDIR /home/app

# Installer Python et les outils de build nécessaires pour node-gyp
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# copier lockfile Bun + package.json pour un install reproductible
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile


# 2 – Builder votre app Next.js
FROM node:24-slim AS builder
WORKDIR /home/app
# réutiliser les node_modules installés
COPY --from=dependencies /home/app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN npm run build


# 3 – Image de runtime légère
FROM node:24-slim AS runner
WORKDIR /home/app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libimage-exiftool-perl \
    && rm -rf /var/lib/apt/lists/*
# copier uniquement l’artefact standalone et les fichiers publics
COPY --from=builder /home/app/.next/standalone ./standalone
COPY --from=builder /home/app/public ./standalone/public
COPY --from=builder /home/app/.next/static ./standalone/.next/static
EXPOSE 3000
ENV PORT=3000
CMD ["node", "./standalone/server.js"]
