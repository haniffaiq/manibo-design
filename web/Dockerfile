FROM node:20-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/web-shared/package.json packages/web-shared/package.json
COPY solutions/appointment_booking/ui/package.json solutions/appointment_booking/ui/package.json
COPY solutions/driver_verification/ui/package.json solutions/driver_verification/ui/package.json

RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app

ARG NEXT_PUBLIC_SOLUTIONS=appointment_booking,driver_verification
ARG NEXT_PUBLIC_ENABLE_TEST_AUTH=false
ARG NEXT_PUBLIC_API_BASE_URL=http://api.grove.localtest.me
ARG NEXT_PUBLIC_APP_URL=
ENV NEXT_PUBLIC_SOLUTIONS=$NEXT_PUBLIC_SOLUTIONS
ENV NEXT_PUBLIC_ENABLE_TEST_AUTH=$NEXT_PUBLIC_ENABLE_TEST_AUTH
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web ./apps/web
COPY packages/ui ./packages/ui
COPY packages/web-shared ./packages/web-shared
COPY solutions/appointment_booking/configs ./solutions/appointment_booking/configs
COPY solutions/appointment_booking/ui ./solutions/appointment_booking/ui
COPY solutions/driver_verification/configs ./solutions/driver_verification/configs
COPY solutions/driver_verification/ui ./solutions/driver_verification/ui
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/packages/web-shared/node_modules ./packages/web-shared/node_modules
COPY --from=deps /app/solutions/appointment_booking/ui/node_modules ./solutions/appointment_booking/ui/node_modules
COPY --from=deps /app/solutions/driver_verification/ui/node_modules ./solutions/driver_verification/ui/node_modules

RUN pnpm --filter @nfq/web build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/turbo.json ./
COPY --from=build /app/apps/web ./apps/web
COPY --from=build /app/packages/ui ./packages/ui
COPY --from=build /app/packages/web-shared ./packages/web-shared
COPY --from=build /app/solutions/appointment_booking/configs ./solutions/appointment_booking/configs
COPY --from=build /app/solutions/appointment_booking/ui ./solutions/appointment_booking/ui
COPY --from=build /app/solutions/driver_verification/configs ./solutions/driver_verification/configs
COPY --from=build /app/solutions/driver_verification/ui ./solutions/driver_verification/ui

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/packages/web-shared/node_modules ./packages/web-shared/node_modules
COPY --from=deps /app/solutions/appointment_booking/ui/node_modules ./solutions/appointment_booking/ui/node_modules
COPY --from=deps /app/solutions/driver_verification/ui/node_modules ./solutions/driver_verification/ui/node_modules

EXPOSE 3000

CMD ["pnpm", "--filter", "@nfq/web", "start", "--hostname", "0.0.0.0", "--port", "3000"]
