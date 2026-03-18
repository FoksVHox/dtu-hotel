# Development Workflow

## Daily start

```bash
composer run dev
```

That's it. This starts Sail, installs any new yarn and composer deps, runs pending migrations, and starts Vite + Horizon + Pail concurrently.

## What `composer run dev` runs

```
./vendor/bin/sail up -d
./vendor/bin/sail yarn
./vendor/bin/sail composer install
./vendor/bin/sail artisan migrate --force
npx concurrently \
  "./vendor/bin/sail artisan horizon:listen --poll" \
  "./vendor/bin/sail artisan pail --timeout=0" \
  "./vendor/bin/sail yarn run dev" \
  --names=server,horizon,logs,vite --kill-others
```

Pail (`logs`) streams Laravel logs inline in the terminal. Horizon (`server`) processes queued jobs. Vite (`vite`) serves the frontend with HMR.

## Running Artisan commands

All Artisan commands must run through Sail:

```bash
vendor/bin/sail artisan make:model Foo --migration --factory --seeder
vendor/bin/sail artisan migrate
vendor/bin/sail artisan db:seed --class=HotelStructureSeeder
vendor/bin/sail artisan tinker
```

## Running Composer commands

```bash
vendor/bin/sail composer require some/package
vendor/bin/sail composer dump-autoload
```

## Frontend changes not reflecting

If a UI change isn't visible, the Vite manifest may be stale. Options:

1. Make sure `composer run dev` is running and check the Vite output in your terminal.
2. If running without `composer run dev`, rebuild: `vendor/bin/sail yarn run build`
3. Hard-refresh the browser (`Cmd+Shift+R` / `Ctrl+Shift+R`).

## Wayfinder route regeneration

Wayfinder generates TypeScript files from Laravel routes automatically when Vite runs. If you add or rename a route, save any file to trigger a Vite rebuild, or restart `composer run dev`.

Generated files are in `resources/js/actions/` and `resources/js/routes/` — do not edit them manually.

## Code formatting

### PHP (Pint)

```bash
vendor/bin/sail bin pint --dirty --format agent
```

Run this before committing. CI will reject PRs with formatting violations.

### TypeScript/React (ESLint + Prettier)

```bash
vendor/bin/sail yarn run lint        # ESLint check
vendor/bin/sail yarn run format      # Prettier format
```

The lint CI job auto-commits formatting fixes on PRs.

## Creating new files

Always use `artisan make:` to generate files — it ensures correct namespace, class structure, and placement:

```bash
# Model with migration, factory, and seeder
vendor/bin/sail artisan make:model RoomRate --migration --factory --seeder

# Form Request
vendor/bin/sail artisan make:request UpdateRoomRequest

# Invokable controller
vendor/bin/sail artisan make:controller GetRoomRatesController --invokable

# Feature test (Pest)
vendor/bin/sail artisan make:test --pest BookingCreationTest
```

## Database

```bash
# Fresh migration + seed (destructive)
vendor/bin/sail artisan migrate:fresh --seed

# Run only new migrations
vendor/bin/sail artisan migrate

# Rollback one batch
vendor/bin/sail artisan migrate:rollback
```

## CI overview

Two GitHub Actions workflows run on every push/PR to `master`:

- **tests.yml** — runs Pest on PHP 8.4 and 8.5 with a real PostgreSQL 17 database
- **lint.yml** — runs Pint, Prettier, and ESLint; auto-commits any fixes

PRs must pass both checks before merging.
