# DTU Hotel

A hotel management SPA for DTU (Technical University of Denmark) fullstack coursework. Hotel chain operators can manage hotel hierarchy, bookings, guests, room accessories, and maintenance.

## Stack

| Layer | Tech |
|-------|------|
| Backend | PHP 8.4, Laravel 13, Fortify v1 |
| Database | PostgreSQL |
| Frontend | React 19, TypeScript (strict), Inertia.js v2 |
| Styling | Tailwind CSS v4, Radix UI |
| Routing | Wayfinder (auto-generated TypeScript route helpers) |
| Dev env | Laravel Sail (Docker) |
| Testing | Pest v4 |

## Quick start

```bash
# 1. Clone and install
composer install && yarn install

# 2. Start everything (Sail + Vite + Horizon + Pail)
composer run dev
```

See [docs/guides/local-setup.md](guides/local-setup.md) for the full first-run walkthrough.

## Documentation

- [Architecture overview](architecture/overview.md) — request lifecycle, service boundaries
- [Data model](architecture/data-model.md) — entities, relationships, enums
- [Frontend architecture](architecture/frontend-architecture.md) — pages, components, Wayfinder
- [Local setup](guides/local-setup.md) — first run from scratch
- [Development workflow](guides/development-workflow.md) — day-to-day commands
- [Testing](guides/testing.md) — running and writing tests
- [Backend conventions](conventions/backend-conventions.md) — PHP/Laravel patterns
- [Frontend conventions](conventions/frontend-conventions.md) — React/TypeScript patterns
- [Authentication](features/authentication.md) — Fortify, 2FA, middleware
- [Bookings](features/bookings.md) — booking creation, validation, guest assignment
- [Rooms](features/rooms.md) — room hierarchy, categories, accessories, status
- [Dashboard](features/dashboard.md) — deferred props, calendar, stat cards
