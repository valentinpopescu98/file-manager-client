#!/bin/bash
set -eu

# Config
APP_NAME="file-manager-client"
CONTAINER_NAME="${APP_NAME}-container"
DOMAIN="filemanager.valentinpopescu.com"
NETWORK_NAME="file-manager-network"
CERTBOT_CONTAINER="certbot-container"

# Go to project directory
cd /home/ubuntu/$APP_NAME || { echo "Project directory not found"; exit 1; }
echo "=== Building and Running File Manager Client ==="

# Stop & remove previous containers if they exist
echo "Cleaning old containers..."
docker-compose down 2>/dev/null || true

# Create network if not existing
if ! docker network ls --format '{{.Name}}' | grep -w $NETWORK_NAME > /dev/null; then
  echo "Creating Docker network: $NETWORK_NAME"
  docker network create $NETWORK_NAME
else
  echo "Network $NETWORK_NAME already exists."
fi

# Create certbot directories if they don't exist
echo "Ensuring certbot directories exist..."
mkdir -p ./certbot/www ./certbot/conf

# Make certbot entrypoint executable
chmod +x ./certbot-entrypoint.sh

# Build and start all services
echo "Building and starting containers..."
docker-compose up -d --build

echo ""
echo "=== Deployment Complete ==="
echo "Client container: $CONTAINER_NAME"
echo "HTTP available at: http://$DOMAIN"
echo "HTTPS will be available once certificate is obtained/renewed"
echo ""
echo "View logs:"
echo "  Client:  docker logs -f $CONTAINER_NAME"
echo "  Certbot: docker logs -f $CERTBOT_CONTAINER"
echo ""
echo "Manual certificate renewal:"
echo "  ./renew-once.sh"