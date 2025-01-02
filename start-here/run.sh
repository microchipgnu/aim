#!/bin/bash

# Build the Docker image
echo "Building Docker image..."
docker build -t aimd-app .

# Run the Docker container
echo "Starting Docker container..."
# Stop any existing container using port 3000
docker stop $(docker ps -q --filter publish=3000) 2>/dev/null || true

# Run the new container and handle kill signals
echo "Starting container with signal handling..."
cleanup() {
    echo "Stopping container..."
    docker stop $(docker ps -q --filter ancestor=aimd-app) 2>/dev/null || true
}

# Set up signal handling
trap cleanup SIGINT SIGTERM

docker run -p 3000:3000 aimd-app

# Run cleanup on exit
cleanup
