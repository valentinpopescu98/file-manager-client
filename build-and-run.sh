#!/bin/bash

# Config
APP_NAME="file-manager-client"
CONTAINER_NAME="${APP_NAME}-container"
IMAGE_NAME="${APP_NAME}-app"

# Go to project directory
cd /home/ubuntu/$APP_NAME || { echo "Project directory not found"; exit 1; }

# Build
echo "Building Docker image for React app..."
docker build -t $IMAGE_NAME .

# Stop & remove previous container if it exists
echo "Cleaning old container if exists..."
docker rm -f $CONTAINER_NAME 2>/dev/null || true

# Run application in container with port 3000 open
echo "Starting new container..."
docker run -d \
  --name $CONTAINER_NAME \
  -p 3000:80 \
  $IMAGE_NAME

echo "Container $CONTAINER_NAME is now running at port 3000"
