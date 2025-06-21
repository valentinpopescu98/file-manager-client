#!/bin/bash
set -eu

# Config
APP_NAME="file-manager-client"
CONTAINER_NAME="${APP_NAME}-container"
DOMAIN="filemanager.valentinpopescu.com"
CERT_PATH="./certbot/conf/live/${DOMAIN}/fullchain.pem"
NETWORK_NAME="file-manager-network"

# Go to project directory
cd /home/ubuntu/$APP_NAME || { echo "Project directory not found"; exit 1; }

# Stop & remove previous container if it exists
echo "Cleaning old container if exists..."
docker-compose down

# Create network if not existing
if ! docker network ls --format '{{.Name}}' | grep -w $NETWORK_NAME > /dev/null; then
  echo "Creating Docker network: $NETWORK_NAME"
  docker network create $NETWORK_NAME
fi

# Start client on HTTP (no TLS config)
echo "Starting client container..."
sudo docker-compose up -d --build client

# Certbot request (only if cert doesn't exist)
if [ ! -f "$CERT_PATH" ]; then
  echo "No certificate found, requesting via Certbot..."
  docker-compose run --rm certbot
else
  echo "Certificate already exists."
fi

# Get container id of running client container
CLIENT_CONTAINER=$(docker ps -qf "name=$CONTAINER_NAME")

# Switch to HTTPS config if certs exist and container is running
if [ -f "$CERT_PATH" ] && [ -n "$CLIENT_CONTAINER" ]; then
  echo "Reloading Nginx in $CONTAINER_NAME with renewed cert..."
  docker exec $CLIENT_CONTAINER nginx -s reload
  echo "HTTPS is active on container $CONTAINER_NAME"
else
  echo "Remaining on HTTP - certificate or container missing"
fi

echo "Container $CONTAINER_NAME is now running at ports 80 and 443"
