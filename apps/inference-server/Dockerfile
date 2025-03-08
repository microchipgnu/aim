FROM oven/bun:latest

WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy the rest of the application
COPY . .

# Set default environment variables (you should set these in fly.toml or via fly secrets)
ENV HOST=0.0.0.0
ENV PORT=3000
ENV SERVER_PORT=3005

ENV GATEWAY_URL=https://aim-gateway.vercel.app/

# Expose port 3000 and bind to all interfaces
EXPOSE 3000

# Set default command to run aimx start
CMD ["bun", "run", "start"]
