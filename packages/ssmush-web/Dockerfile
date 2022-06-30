# syntax=docker/dockerfile:experimental
FROM node:16

ENV NODE_ENV production

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN --mount=type=ssh --mount=type=secret,id=NODE_AUTH_TOKEN --mount=type=secret,id=npmrc,dst=/usr/src/app/.npmrc \
    export NODE_AUTH_TOKEN="$(cat /run/secrets/NODE_AUTH_TOKEN)" \
    && yarn install --frozen-lockfile

# Bundle app source
COPY build/. .

EXPOSE 8080
CMD [ "node", "index.js" ]