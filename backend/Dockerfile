# Backend Dockerfile
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the backend code
COPY . .

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
