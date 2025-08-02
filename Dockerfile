# Step 1
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3512
CMD ["node", "app.js"]
