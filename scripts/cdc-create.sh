#!/bin/sh
set -e

echo "Waiting for TiCDC..."
until curl -sf http://ticdc:8300/api/v1/status >/dev/null; do
  echo "waiting ticdc"
  sleep 2
done

echo "Creating changefeed if missing..."
/cdc cli changefeed list --server=http://ticdc:8300 | grep -q '"id":"helfy-cf"' || \
/cdc cli changefeed create \
  --server=http://ticdc:8300 \
  --changefeed-id=helfy-cf \
  --sink-uri='kafka://kafka:9092/helfy.cdc?protocol=open-protocol&partition-num=1' \
  --config=/cdc.toml

/cdc cli changefeed resume --server=http://ticdc:8300 --changefeed-id=helfy-cf || true

echo "Changefeed ready"
sleep infinity
