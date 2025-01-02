FROM node:slim

WORKDIR /app

# Install aimd using npm
RUN npm install -g aimd@0.1.3

# Echo aimd version
RUN aimd -V

# Copy examples folder
COPY examples/ /app/routes/

# Copy .env file
COPY .env /app/.env

# Set environment variables from .env
ENV $(cat /app/.env | xargs)

# Expose port 3000 and bind to all interfaces
EXPOSE 3000
ENV HOST=0.0.0.0

# Set default command to run aimd start
CMD ["aimd", "start"]
