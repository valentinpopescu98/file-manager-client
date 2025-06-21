#!/bin/bash
set -eu

# Config
APP_NAME="file-manager-client"
CONTAINER_NAME="${APP_NAME}-container"

# Go to project directory
cd /home/ubuntu/$APP_NAME || { echo "Project directory not found"; exit 1; }

# Stop & remove previous container if it exists
echo "Stopping and removing container: $CONTAINER_NAME"
docker-compose down

echo "Cleanup completed for $CONTAINER_NAME"
