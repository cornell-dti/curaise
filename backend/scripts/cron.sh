#!/usr/bin/env bash
# Heroku Scheduler entrypoint for the backend cron routes.
#
# Usage (as the Scheduler job command):
#   bash backend/scripts/cron.sh payment-reminders
#   bash backend/scripts/cron.sh pickup-reminders
#
# Reads SUPABASE_SERVICE_KEY from the dyno environment so the key never appears
# in the job command, which Heroku prints to the logs on every run.
set -euo pipefail

route="${1:-}"
case "$route" in
  payment-reminders|pickup-reminders) ;;
  *)
    echo "usage: cron.sh <payment-reminders|pickup-reminders>" >&2
    exit 2
    ;;
esac

base_url="${CRON_BASE_URL:-https://curaise-app-fd4f02d38d42.herokuapp.com}"
key="${SUPABASE_SERVICE_KEY:?SUPABASE_SERVICE_KEY is not set}"

status=$(curl -sS -o /dev/null -w '%{http_code}' -X POST \
  -H "Authorization: Bearer $key" \
  "$base_url/api/order/cron/$route")

echo "cron $route -> HTTP $status"
[[ "$status" =~ ^2 ]]
