#!/bin/bash
set -eu

# Variables from environment
DOMAIN="${DOMAIN:-filemanager.valentinpopescu.com}"
EMAIL="${EMAIL:-contact@valentinpopescu.com}"
CHECK_INTERVAL="${CHECK_INTERVAL:-86400}"
CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
RENEW_DAYS_THRESHOLD=30

echo "=== Certbot Manager Started ==="
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "Check interval: ${CHECK_INTERVAL}s ($(($CHECK_INTERVAL / 3600))h)"

# Function to get days left until expiration
get_days_left() {
  if [ ! -f "$CERT_PATH" ]; then
    echo "-1"
    return
  fi

  # Get expiration date in seconds since epoch
  end_date_seconds=$(openssl x509 -enddate -noout -in "$CERT_PATH" | cut -d= -f2 | xargs -I {} date -d {} +%s 2>/dev/null || echo "0")

  # If date parsing failed, try alternative method using openssl directly
  if [ "$end_date_seconds" = "0" ]; then
    # Convert cert date format to epoch using Python (available in certbot image)
    end_date=$(openssl x509 -enddate -noout -in "$CERT_PATH" | cut -d= -f2)
    end_date_seconds=$(python3 -c "from datetime import datetime; import sys; print(int(datetime.strptime('$end_date', '%b %d %H:%M:%S %Y %Z').timestamp()))" 2>/dev/null || echo "0")
  fi

  now_seconds=$(date +%s)
  if [ "$end_date_seconds" = "0" ] || [ "$now_seconds" = "0" ]; then
    echo "-1"
    return
  fi
    
  echo $(( (end_date_seconds - now_seconds) / 86400 ))
}

# Function to obtain or renew certificate
manage_certificate() {
  local days_left=$1
  
  if [ "$days_left" -eq -1 ]; then
    echo "No certificate found. Obtaining new certificate..."
    certbot certonly --webroot -w /var/www/certbot \
      -d "$DOMAIN" \
      --email "$EMAIL" \
      --agree-tos \
      --no-eff-email \
      --non-interactive
    return $?
  fi
  
  if [ "$days_left" -lt 0 ]; then
    echo "Certificate EXPIRED ($days_left days). Force renewing..."
    certbot certonly --webroot -w /var/www/certbot \
      -d "$DOMAIN" \
      --email "$EMAIL" \
      --agree-tos \
      --no-eff-email \
      --non-interactive \
      --force-renewal
    return $?
  fi
  
  if [ "$days_left" -lt "$RENEW_DAYS_THRESHOLD" ]; then
    echo "Certificate expiring in $days_left days. Renewing..."
    certbot renew --webroot -w /var/www/certbot
    return $?
  fi
  
  echo "Certificate still valid for $days_left days. No action needed."
  return 1
}

# Function to reload nginx
reload_nginx() {
  echo "Certificate updated. You can reload nginx manually with:"
  echo "  docker exec file-manager-client-container nginx -s reload"
  echo "Or run: ./reload-nginx.sh"
  return 0
}

# Initial check and certificate management
echo ""
echo "--- Initial Certificate Check ---"
DAYS_LEFT=$(get_days_left)

if [ "$DAYS_LEFT" -eq -1 ]; then
  echo "No existing certificate found."
else
  echo "Current certificate valid for $DAYS_LEFT days."
fi

if manage_certificate "$DAYS_LEFT"; then
  echo "Certificate operation completed successfully."
  sleep 5
  reload_nginx
else
  echo "No certificate operation performed."
fi

# Continuous renewal loop
echo ""
echo "=== Starting Renewal Loop ==="
echo "Checking every $(($CHECK_INTERVAL / 3600)) hours for certificates expiring within $RENEW_DAYS_THRESHOLD days."

while true; do
  echo ""
  echo "---"
  echo "$(date): Running periodic certificate check..."

  DAYS_LEFT=$(get_days_left)
  
  if [ "$DAYS_LEFT" -eq -1 ]; then
    echo "Warning: Certificate file not found!"
  else
    echo "Certificate valid for $DAYS_LEFT days."
  fi
  
  if manage_certificate "$DAYS_LEFT"; then
    echo "Certificate renewed. Reloading nginx..."
    sleep 5
    reload_nginx
  fi
  
  echo "Next check at: $(date -d "+${CHECK_INTERVAL} seconds" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date)"
  sleep "$CHECK_INTERVAL"
done
