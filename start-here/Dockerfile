FROM node:slim

WORKDIR /app

# Install aimx using npm
RUN npm install -g aimx@0.1.38

# Echo aimx version
RUN aimx -V

# Copy the entire application
COPY . .

# Set default environment variables (you should set these in fly.toml or via fly secrets)
ENV HOST=0.0.0.0
ENV PORT=3000

# Expose port 3000 and bind to all interfaces
EXPOSE 3000

# Set default command to run aimx start
CMD ["aimx", "start", "-d", ".", "--ui"]
