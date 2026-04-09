FROM node:20-alpine AS deps

WORKDIR /app

# Install contracts from tarball
COPY givself-contracts-0.2.0.tgz ./
COPY package.json package-lock.json ./

# Replace local file dependency with tarball
RUN sed -i 's|"file:../givself-contracts/gen/ts"|"file:./givself-contracts-0.2.0.tgz"|' package.json
RUN npm install

# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./
COPY --from=deps /app/givself-contracts-0.2.0.tgz ./

COPY next.config.ts tsconfig.json postcss.config.mjs ./
COPY src/ ./src/
COPY public/ ./public/

RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
