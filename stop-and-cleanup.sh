#!/bin/bash

# Config
APP_NAME="file-manager-client"
CONTAINER_NAME="${APP_NAME}-container"

# Stop & remove previous container if it exists
echo "Cleaning old container if exists..."
docker rm -f $CONTAINER_NAME 2>/dev/null || true

echo "Cleanup completed for $CONTAINER_NAME"
