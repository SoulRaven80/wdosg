FROM node:23-alpine3.19

# Create app directory
WORKDIR /app
COPY . .

RUN npm install bcrypt
RUN npm install
EXPOSE 3001
CMD [ "node", "index" ]