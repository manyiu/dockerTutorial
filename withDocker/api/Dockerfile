FROM node:alpine

WORKDIR /app

RUN apk add tzdata

ENV TZ=Asia/HongKong

COPY ./package.json ./

RUN npm install

COPY . .

CMD ["npm", "run", "dev"]