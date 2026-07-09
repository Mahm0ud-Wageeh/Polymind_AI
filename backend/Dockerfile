# syntax=docker/dockerfile:1
FROM php:8.3-fpm-alpine AS base

RUN apk add --no-cache \
        bash git curl libpng-dev libzip-dev icu-dev postgresql-dev oniguruma-dev \
        supervisor nginx \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip intl bcmath opcache pcntl \
    && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /var/www/html

# Install PHP dependencies first for better layer caching.
COPY composer.json composer.lock* ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist \
    || composer update --no-dev --no-scripts --no-autoloader --prefer-dist

COPY . .
# Create the writable dirs BEFORE the full install: composer's post-autoload-dump
# runs `artisan package:discover`, which needs bootstrap/cache to already exist.
RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && composer install --no-dev --optimize-autoloader --no-interaction \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
# Normalize line endings (Windows checkouts ship CRLF, which breaks the shebang)
# and make the entrypoint executable.
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint && chmod +x /usr/local/bin/entrypoint

EXPOSE 80
ENTRYPOINT ["entrypoint"]
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
