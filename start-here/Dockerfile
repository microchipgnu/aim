FROM node:slim

WORKDIR /app

# Install aimx using npm
RUN npm install -g aimx@0.1.8

# Echo aimx version
RUN aimx -V

# Copy examples folder
COPY examples/ /app/routes/

# Copy .env file
COPY .env /app/.env

# Set environment variables from .env
ENV $(cat /app/.env | xargs)

# Expose port 3000 and bind to all interfaces
EXPOSE 3000
ENV HOST=0.0.0.0

# Set default command to run aimx start
CMD ["aimx", "start", "--dir", "./routes"]
