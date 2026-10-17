FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy root configurations
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY packages ./packages/
COPY apps ./apps/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Client-side Next.js environment arguments
ARG APP_NAME
ARG NEXT_PUBLIC_GATEWAY_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL

ENV NEXT_PUBLIC_GATEWAY_URL=$NEXT_PUBLIC_GATEWAY_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL

# Build the specified Next.js frontend application
WORKDIR /app/apps/${APP_NAME}
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app /app

ARG APP_NAME
WORKDIR /app/apps/${APP_NAME}

CMD ["pnpm", "start"]
