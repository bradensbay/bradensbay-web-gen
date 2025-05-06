# Use the official Node.js image
FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .
COPY ./config.js ./

# Expose the port used by the service
EXPOSE 3006

# Start the application
CMD ["node", "index.js"]