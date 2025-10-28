#!/bin/bash
set -eu

DOMAIN="filemanager.valentinpopescu.com"
CERT_PATH="./certbot/conf/live/${DOMAIN}/fullchain.pem"
APP_NAME="file-manager-client"
CONTAINER_NAME="${APP_NAME}-container"
CERTBOT_CONTAINER="certbot-container"

echo "=== Manual Certificate Renewal ==="

# Check if certificate exists and get days left
if [ ! -f "$CERT_PATH" ]; then
  echo "No certificate found at $CERT_PATH"
  echo "Obtaining new certificate..."
  
  docker exec $CERTBOT_CONTAINER certbot certonly --webroot -w /var/www/certbot \
    -d "$DOMAIN" \
    --email valentin@valentinpopescu.com \
    --agree-tos \
    --no-eff-email \
    --non-interactive
else
  end_date=$(openssl x509 -enddate -noout -in "$CERT_PATH" | cut -d= -f2)
  end_date_seconds=$(date -d "$end_date" +%s)
  now_seconds=$(date +%s)
  days_left=$(( (end_date_seconds - now_seconds) / 86400 ))
  
  echo "Current certificate valid for $days_left days."
  
  if [ "$days_left" -lt 0 ]; then
    echo "Certificate EXPIRED. Force renewing..."
    docker exec $CERTBOT_CONTAINER certbot certonly --webroot -w /var/www/certbot \
      -d "$DOMAIN" \
      --email valentin@valentinpopescu.com \
      --agree-tos \
      --no-eff-email \
      --non-interactive \
      --force-renewal
  else
    echo "Renewing certificate..."
    docker exec $CERTBOT_CONTAINER certbot renew --webroot -w /var/www/certbot
  fi
fi

# Reload nginx if container is running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Reloading nginx..."
  docker exec "$CONTAINER_NAME" nginx -s reload
  echo "Nginx reloaded successfully."
else
  echo "Warning: Client container not running. Nginx not reloaded."
fi

echo ""
echo "Certificate renewal complete!"
