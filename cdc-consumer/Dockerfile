FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY index.js .
ENV KAFKA_BROKERS=kafka:9092
ENV CDC_TOPIC=helfy.cdc
CMD ["node", "index.js"]
