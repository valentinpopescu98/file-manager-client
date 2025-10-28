#!/bin/bash
set -eu

CONTAINER_NAME="file-manager-client-container"

echo "Reloading nginx in $CONTAINER_NAME..."

if docker exec "$CONTAINER_NAME" nginx -s reload 2>/dev/null; then
  echo "Nginx reloaded successfully!"
else
  echo "Failed to reload nginx. Container might not be running."
  exit 1
fi