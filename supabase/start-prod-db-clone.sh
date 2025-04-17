#!/bin/bash
set -e

# Load environment variables
source .env.dev

# Sanity checks
: "${PROD_DB_URL:?PROD_DB_URL is not set in .env.dev}"
: "${LOCAL_DB_PASSWORD:?LOCAL_DB_PASSWORD is not set in .env.dev}"

# Set paths
DUMP_FILE="db_dump.sql"

echo "Exporting production database..."
DUMP_ERR=$(mktemp)

if ! pg_dump "$PROD_DB_URL" --no-owner --no-privileges --clean >"$DUMP_FILE" 2>"$DUMP_ERR"; then
    echo "❌ pg_dump failed:"
    cat "$DUMP_ERR"
    rm "$DUMP_ERR"
    exit 1
fi

rm "$DUMP_ERR"

echo "Starting local Supabase..."
supabase start

echo "Waiting for local database to be ready..."
until pg_isready -h localhost -p 54322 -U postgres >/dev/null 2>&1; do
    sleep 1
done

echo "Importing production dump into local Supabase..."
export PGPASSWORD="$LOCAL_DB_PASSWORD"
if ! psql -h localhost -p 54322 -U postgres -d postgres <"$DUMP_FILE" >/dev/null 2>&1; then
    echo "❌ Error occurred during database import"
    unset PGPASSWORD
    exit 1
fi

# Update admin user privy_id
echo "Updating admin user's privy_id..."
: "${ADMIN_USERNAME:?ADMIN_USERNAME is not set in .env.dev}"
: "${ADMIN_PRIVY_ID:?ADMIN_PRIVY_ID is not set in .env.dev}"

psql -h localhost -p 54322 -U postgres -d postgres <<EOF
UPDATE users
SET privy_id = '${ADMIN_PRIVY_ID}'
WHERE username = '${ADMIN_USERNAME}';
EOF

unset PGPASSWORD

rm -f "$DUMP_FILE"

echo "Done ✅ Prod DB imported into Local Supabase dev environment"
