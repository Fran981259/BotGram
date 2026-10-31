# Frontend — Portal Cerrado (Next.js)
FROM node:22-alpine AS base

WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://portal_cerrado:8000
ARG NEXT_PUBLIC_SITE_URL=https://www.portalcerrado.com.br
ARG NEXT_PUBLIC_MATOMO_URL=https://analytics.portalcerrado.com.br/
ARG NEXT_PUBLIC_MATOMO_SITE_ID=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_MATOMO_URL=${NEXT_PUBLIC_MATOMO_URL}
ENV NEXT_PUBLIC_MATOMO_SITE_ID=${NEXT_PUBLIC_MATOMO_SITE_ID}

COPY package.json package-lock.json* ./
RUN npm ci --include=dev

COPY . .
RUN npm run build
RUN npm prune --omit=dev

# Configuração de non-root user
RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["npm", "start"]
