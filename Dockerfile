FROM node:current-alpine3.18 AS BULD
WORKDIR ./app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["yarn", "start"]