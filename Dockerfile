# 1 - Installer les dépendances
FROM node:18-alpine AS dependencies
WORKDIR /app

# Installer les dépendances nécessaires pour sharp et autres packages natifs
RUN apk add --no-cache libc6-compat python3 make g++ ffmpeg

# Copier les fichiers de dépendances
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* bun.lockb* ./

# Installer les dépendances
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
  elif [ -f bun.lockb ]; then npm install; \
  else echo "Lockfile not found." && exit 1; \
  fi

# 2 - Builder l'application Next.js
FROM node:18-alpine AS builder
WORKDIR /app

# Arguments de build pour les variables publiques Next.js
ARG NEXT_PUBLIC_APP_URL

# Copier les node_modules depuis l'étape dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copier tous les fichiers source
COPY . .

# Variables d'environnement pour le build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Build Next.js en mode standalone
RUN npm run build

# 3 - Image de runtime légère
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Installer ffmpeg pour la génération de thumbs vidéo
RUN apk add --no-cache ffmpeg

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Créer les répertoires nécessaires
RUN mkdir -p /app/public/thumbs && chown -R nextjs:nodejs /app

# Copier les fichiers nécessaires depuis le builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Passer à l'utilisateur non-root
USER nextjs

# Exposer le port
EXPOSE 3000

ENV PORT=3000

# Démarrer l'application
CMD ["node", "server.js"]
