# --- Build stage ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

ARG VITE_API_URL=https://backend-production-2485.up.railway.app/api
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env.production

RUN npm run build

# --- Production stage ---
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/dist ./dist

ENV PORT=3000
EXPOSE 3000
CMD sh -c "serve -s dist -l \$PORT"
