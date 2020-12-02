FROM node:14-alpine
USER node:node
RUN mkdir /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]
