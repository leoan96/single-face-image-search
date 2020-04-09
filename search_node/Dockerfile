FROM node:12.16.1

WORKDIR /home/node

COPY package.json package-lock*.json ./

RUN npm install && npm cache clean --force

COPY . .

CMD [ "npm", "run", "deploy" ]
