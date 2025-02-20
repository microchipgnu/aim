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

ENV R2_ACCOUNT_ID=97c691498b367789962e77080bf302c0
ENV R2_ACCESS_KEY_ID=54bedcefef1c420f5bfe063148a2e26e
ENV R2_SECRET_ACCESS_KEY=8cc1dc005fd2eedea58607d6fcd4d6a0b9b59de3c02c931e6cf8b560f894f9ae
ENV R2_BUCKET_NAME=aim-storage

ENV OPENAI_API_KEY="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"
ENV REPLICATE_API_KEY="r8_ctXKINlracexbHYHcvpEzWKIOX6n99j3HBk0X"
ENV OPENROUTER_API_KEY="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"

ENV GATEWAY_URL=https://aim-gateway.vercel.app/

# Expose port 3000 and bind to all interfaces
EXPOSE 3000

# Set default command to run aimx start
CMD ["bun", "run", "start"]
