FROM node:18

WORKDIR /clash-calendar

COPY package*.json ./

RUN npm install

COPY src/ src/
COPY tsconfig.json ./
COPY .eslintrc.cjs ./

RUN npm run build

CMD [ "npm", "start" ]
