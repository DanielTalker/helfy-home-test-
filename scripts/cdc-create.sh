#!/bin/sh
set -e

CF_ID="helfy-cdc"
SINK_URI="kafka://kafka:9092/helfy.cdc?protocol=canal-json&partition-num=1&max-message-bytes=10485760"
SERVER_URL="http://ticdc:8300"

echo "[CDC] Starting changefeed setup..."

# locate config
if [ -f "/etc/ticdc/cdc.toml" ]; then
  CFG="/etc/ticdc/cdc.toml"
elif [ -f "/cdc.toml" ]; then
  CFG="/cdc.toml"
else
  echo "[CDC] ERROR: cdc.toml not found in container!"
  ls -la /
  exit 1
fi
echo "[CDC] Using config file: $CFG"
echo "[CDC] Config content:"
sed -n '1,120p' "$CFG" || true

# wait for TiCDC to be ready
echo "[CDC] Waiting for TiCDC to be ready..."
i=0
until /cdc cli capture list --server="$SERVER_URL" >/dev/null 2>&1; do
  i=$((i+1))
  if [ "$i" -gt 60 ]; then
    echo "[CDC] ERROR: TiCDC not ready after 60s"
    exit 1
  fi
  sleep 1
done
echo "[CDC] TiCDC is ready."

# remove existing feed (ignore errors)
echo "[CDC] Removing old changefeed if exists..."
/cdc cli changefeed remove --force --server="$SERVER_URL" --changefeed-id="$CF_ID" >/dev/null 2>&1 || true

# wait for removal
echo "[CDC] Waiting for old changefeed to disappear (if any)..."
i=0
while /cdc cli changefeed query --server="$SERVER_URL" --changefeed-id="$CF_ID" >/dev/null 2>&1; do
  i=$((i+1))
  if [ "$i" -gt 10 ]; then
    echo "[CDC] WARNING: old changefeed still exists after 10s, continuing..."
    break
  fi
  sleep 1
done

# create new feed with retry
echo "[CDC] Creating new changefeed (with retry until Kafka is up)..."
for attempt in $(seq 1 20); do
  if /cdc cli changefeed create \
      --server="$SERVER_URL" \
      --sink-uri="$SINK_URI" \
      --changefeed-id="$CF_ID" \
      --config="$CFG"; then
    echo "[CDC] Changefeed '$CF_ID' created successfully."
    break
  else
    echo "[CDC] Create failed (attempt $attempt). Will retry in 3s..."
    sleep 3
  fi
done

# show list
echo "[CDC] Current changefeeds:"
/cdc cli changefeed list --server="$SERVER_URL" || true
