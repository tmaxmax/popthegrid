FROM node:14-alpine AS build
WORKDIR /build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm t
ARG NODE_ENV
ARG DEBUG
RUN NODE_ENV=${NODE_ENV} DEBUG=${DEBUG} npm run build

FROM nginx:1.19-alpine
COPY --from=build /build/public /usr/share/nginx/html
