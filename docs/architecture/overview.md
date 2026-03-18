# Architecture Overview

## What it is

DTU Hotel is a single-page application (SPA) where the backend serves data and the frontend handles rendering. There is no Blade-rendered HTML for authenticated pages — everything goes through Inertia.js.

## Stack diagram

```
Browser
  └── React 19 (SPA, TypeScript strict)
        ├── Inertia.js v2 — manages page transitions, form submissions, shared props
        ├── Wayfinder — auto-generated TS functions for all Laravel routes
        ├── Tailwind CSS v4 + Radix UI — styling and accessible primitives
        └── Vite 7 — bundler (HMR in dev, static build for prod)

Laravel 13
  ├── routes/web.php + routes/settings.php — all HTTP routes
  ├── Inertia::render() — returns JSON page components (not Blade HTML)
  ├── Fortify — headless auth backend (login, register, 2FA, password reset)
  ├── Eloquent ORM — models and relationships
  ├── Form Requests — all input validation
  ├── Action classes (app/Actions/) — business logic extracted from controllers
  └── Horizon — queue worker management

PostgreSQL
  └── Primary datastore
```

## Inertia request lifecycle

Inertia makes every navigation feel like a SPA while keeping server-side routing:

1. **First load** — Laravel renders a single Blade shell (`resources/views/app.blade.php`) with the initial page component and props embedded as JSON in a `<div data-page>` attribute.
2. **Subsequent navigation** — Inertia intercepts `<Link>` clicks and sends an XHR with `X-Inertia: true`. Laravel returns JSON `{ component, props, url }` instead of full HTML.
3. **Form submissions** — `useForm` / `<Form>` from `@inertiajs/react` submits via Inertia, which returns the same JSON structure with updated props.
4. **Shared props** — `HandleInertiaRequests` middleware (`app/Http/Middleware/HandleInertiaRequests.php`) merges auth user and flash data into every response.

## Middleware stack (bootstrap/app.php)

Web requests run through:
1. `HandleAppearance` — reads the `appearance` cookie and sets light/dark mode context
2. `HandleInertiaRequests` — injects shared props (auth user, flash messages)
3. `AddLinkHeadersForPreloadedAssets` — adds `<Link rel=preload>` headers for Vite assets

The `appearance` and `sidebar_state` cookies are excluded from encryption so they can be read client-side.

## Key architectural decisions

**Invokable controllers for simple reads** — single-action controllers (`__invoke`) are used when a route maps 1:1 to one query + render. `DashboardController`, `MaintenanceController`, `SearchGuestsController` all use this pattern.

**Form Request classes for all validation** — no inline `$request->validate()` calls in controllers. Custom after-hooks in `StoreBookingRequest` handle cross-field business rules (guest presence, room availability).

**Action classes for complex queries** — expensive dashboard queries (`BuildTodayActivity`, `BuildRoomStatus`, `BuildBookingPipeline`) live in `app/Actions/Dashboard/` and are resolved via the service container. This keeps the controller thin and makes actions independently testable.

**Deferred props for non-critical data** — the three dashboard stat cards use `Inertia::defer()` so the main calendar renders immediately while stats load separately. See [features/dashboard.md](../features/dashboard.md).

**No client-side state management library** — Inertia props + React `useState`/`useReducer` are sufficient. No Redux or Zustand.

## Directory structure (key paths)

```
app/
  Actions/          # Invokable business logic classes
  Enums/            # PHP 8.1 backed enums (BookingStatus, RoomStatus)
  Http/
    Controllers/    # Thin controllers — delegate to actions or models directly
    Middleware/     # HandleAppearance, HandleInertiaRequests
    Requests/       # Form Request validation classes
  Models/           # Eloquent models
  Providers/        # AppServiceProvider, FortifyServiceProvider, etc.

resources/js/
  pages/            # Inertia page components (one file per route)
  components/       # Shared React components
    ui/             # Radix UI wrappers (button, dialog, input, etc.)
  layouts/          # App shell, auth layout
  hooks/            # Custom React hooks
  types/            # TypeScript type definitions
  actions/          # Wayfinder-generated route functions (auto-generated, do not edit)
  routes/           # Wayfinder-generated named route functions (auto-generated, do not edit)

routes/
  web.php           # Main application routes
  settings.php      # User settings routes
  console.php       # Artisan schedule
```
