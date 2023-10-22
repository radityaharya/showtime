FROM node:21-alpine AS dependencies
RUN apk add --no-cache libc6-compat
WORKDIR /home/app
COPY package.json ./
COPY package-lock.json ./
RUN npm i

FROM node:21-alpine AS builder
RUN apk add --no-cache ca-certificates
WORKDIR /home/app
COPY --from=dependencies /home/app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
ARG NODE_ENV
ENV NODE_ENV="${NODE_ENV}"
RUN npm run build

FROM node:21-alpine AS runner
RUN apk add --no-cache ca-certificates
WORKDIR /home/app
ENV NEXT_TELEMETRY_DISABLED 1
COPY --from=builder /home/app/package.json ./
COPY --from=builder /home/app/package-lock.json ./
COPY --from=builder /home/app/.next ./.next
COPY --from=builder /home/app/node_modules ./node_modules
EXPOSE 3000
ENV PORT 3000
CMD ["./node_modules/.bin/next", "start", "--port", "3000"]