#!/bin/bash
set -eu

DOMAIN="filemanager.valentinpopescu.com"
CERT_PATH="./certbot/conf/live/${DOMAIN}/fullchain.pem"
APP_NAME="file-manager-client"
CONTAINER_NAME="${APP_NAME}-container"
RENEW_DAYS_THRESHOLD=30

function get_cert_days_left() {
  if [ ! -f "$CERT_PATH" ]; then
    echo 0
    return
  fi

  end_date=$(openssl x509 -enddate -noout -in "$CERT_PATH" | cut -d= -f2)
  end_date_seconds=$(date -d "$end_date" +%s)
  now_seconds=$(date +%s)
  echo $(( (end_date_seconds - now_seconds) / 86400 ))
}

# Check if certificate needs renewal
DAYS_LEFT=$(get_cert_days_left)
echo "Certificate valid for $DAYS_LEFT more days."

if [ "$DAYS_LEFT" -lt "$RENEW_DAYS_THRESHOLD" ]; then
  echo "Renewing certificate..."
  docker-compose run --rm certbot renew --webroot -w /var/www/certbot
  echo "Renew finished."
else
  echo "Certificate is still valid. No need to renew."
fi

# Reload nginx if container runs and certificates are present
if [ -f "$CERT_PATH" ]; then
  CLIENT_CONTAINER=$(docker ps -qf "name=$CONTAINER_NAME")
  if [ -n "$CLIENT_CONTAINER" ]; then
    echo "Copying SSL config and reloading Nginx in $CONTAINER_NAME..."
    docker cp nginx.ssl.conf $CLIENT_CONTAINER:/etc/nginx/conf.d/default.conf
    docker exec $CLIENT_CONTAINER nginx -s reload
    echo "Reloaded Nginx with new certificate."
  else
    echo "Client container not running; skipping nginx reload."
  fi
else
  echo "No certificate found after renew attempt."
fi
