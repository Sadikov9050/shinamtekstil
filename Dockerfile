FROM node:22-alpine

WORKDIR /app

COPY package.json server.mjs index.html styles.css script.js brand-mark.svg ./
COPY assets ./assets
COPY public ./public

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.mjs"]
