# Local Setup

## Prerequisites

- Docker Desktop (for Laravel Sail)
- PHP 8.4 + Composer (to run `composer install` before Sail is up)
- Node.js LTS + Yarn

## First-time setup

### 1. Install PHP dependencies

```bash
composer install
```

This must run on your host machine (not inside Sail) because Sail itself isn't running yet.

### 2. Configure environment

```bash
cp .env.example .env
php artisan key:generate
```

Open `.env` and set your database credentials. The default Sail config uses:

```dotenv
DB_CONNECTION=pgsql
DB_HOST=pgsql
DB_PORT=5432
DB_DATABASE=dtu_hotel
DB_USERNAME=sail
DB_PASSWORD=password
```

These match Sail's default PostgreSQL container — no changes needed if you're using Sail.

### 3. Start development

```bash
composer run dev
```

This single command:
1. Starts Sail containers (`sail up -d`)
2. Installs Node dependencies (`sail yarn`)
3. Runs pending migrations (`sail artisan migrate --force`)
4. Starts four concurrent processes:
   - **server** — Horizon queue worker (`horizon:listen`)
   - **logs** — Pail log viewer (`pail --timeout=0`)
   - **vite** — Vite dev server with HMR
   - (kill-others: stopping one stops all)

The app is available at `http://localhost` (port 80 via Sail's nginx).

### 4. Seed test data

```bash
vendor/bin/sail artisan db:seed
```

Seeders run in this order (defined in `database/seeders/DatabaseSeeder.php`):
1. `UserSeeder` — creates test user accounts
2. `ReferenceDataSeeder` — room categories and accessories
3. `HotelStructureSeeder` — one hotel with buildings, floors, rooms
4. `GuestSeeder` — sample guests
5. `BookingSeeder` — sample bookings with guest assignments

## Stopping the environment

```bash
vendor/bin/sail stop
```

Or just `Ctrl+C` in the `composer run dev` terminal (kill-others will stop all processes).

## Rebuilding assets

If you switch branches and the Vite manifest is missing or stale:

```bash
vendor/bin/sail yarn run build
```

Or restart `composer run dev` to get HMR back.

## Telescope (debugging)

Laravel Telescope is available at `/telescope` in local environments. It is manually registered in `TelescopeServiceProvider` and excluded from auto-discovery in `composer.json`.

## Horizon (queue monitor)

Laravel Horizon is available at `/horizon` in local environments. The queue worker starts automatically as part of `composer run dev`.

## SSR mode (optional)

For server-side rendering:

```bash
composer run dev:ssr
```

This builds the SSR bundle and starts `artisan inertia:start-ssr` instead of Vite dev.
