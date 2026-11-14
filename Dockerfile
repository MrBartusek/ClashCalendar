FROM node:24-alpine AS build

WORKDIR /clash-calendar

COPY package*.json ./

RUN npm ci

COPY src/ src/
COPY tsconfig.json ./
COPY .eslintrc.cjs ./

RUN npm run build && npm prune --omit=dev

FROM node:24-alpine

WORKDIR /clash-calendar

COPY --from=build /clash-calendar/package.json ./
COPY --from=build /clash-calendar/node_modules node_modules/
COPY --from=build /clash-calendar/dist dist/

USER node

CMD [ "node", "dist/index.js" ]
