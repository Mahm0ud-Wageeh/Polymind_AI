#!/bin/sh
set -e

# Wait for the database to accept connections.
if [ -n "$DB_HOST" ]; then
  echo "Waiting for database at $DB_HOST:${DB_PORT:-5432}..."
  until php -r "exit(@fsockopen(getenv('DB_HOST'), (int)(getenv('DB_PORT') ?: 5432)) ? 0 : 1);" 2>/dev/null; do
    sleep 2
  done
fi

# Generate an app key if missing.
if ! grep -q "^APP_KEY=base64" .env 2>/dev/null; then
  php artisan key:generate --force || true
fi

# Publish vendor config/migrations (spatie/permission, sanctum) if not present.
php artisan vendor:publish --tag=permission-config --force || true
php artisan vendor:publish --tag=permission-migrations --force || true

# Patch spatie/permission migration to support UUID model keys.
# Our User model uses UUID primary keys, but Spatie's default migration makes
# model_id an unsignedBigInteger. Convert the morph key column to uuid.
for f in database/migrations/*create_permission_tables.php; do
  [ -f "$f" ] && sed -i 's/unsignedBigInteger(\$columnNames/uuid(\$columnNames/g' "$f"
done

# Run migrations + seed on boot (idempotent seeders).
php artisan migrate --force || true
php artisan db:seed --force || true

# Cache framework config for production performance.
php artisan config:cache || true
php artisan route:cache || true

exec "$@"
