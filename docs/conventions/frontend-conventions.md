# Frontend Conventions

## File structure

Each file should have one clear responsibility:
- `pages/` — Inertia page components (one per route, handles props)
- `components/` — reusable UI components
- `components/ui/` — low-level Radix UI wrappers (no business logic)
- `layouts/` — page shell wrappers
- `hooks/` — custom React hooks
- `types/` — TypeScript interfaces/types

## Component exports

Use named exports only — no default exports:

```typescript
// Good
export function RoomStatusBadge({ status }: Props) { ... }

// Bad
export default function RoomStatusBadge({ status }: Props) { ... }
```

## TypeScript

Strict mode is enabled. No `any`, no silent casts.

Define page props as interfaces:

```typescript
interface Props {
    rooms: Room[];
    bookings: Booking[];
    weekStart: string;
}

export default function Dashboard({ rooms, bookings, weekStart }: Props) { ... }
```

Types shared across pages live in `resources/js/types/`.

## Routing with Wayfinder

Never hardcode URLs. Import route helpers from `@/actions/` (controller-based) or `@/routes/` (named routes):

```typescript
import BookingController from '@/actions/BookingController';
import { guests } from '@/routes/guests';

// In a form submission
form.submit(BookingController.store());

// In a fetch call
const response = await fetch(guests.search({ q: searchTerm }));
```

Wayfinder files are auto-generated — never edit them manually.

The `.form()` variant integrates with Inertia's `useForm`:

```typescript
const form = useForm({ ... });
form.submit(BookingController.store.form());
```

## Inertia navigation

Use Inertia's `<Link>` for navigation — never `<a href>` for internal links:

```typescript
import { Link } from '@inertiajs/react';

<Link href={route('dashboard')}>Dashboard</Link>
```

For programmatic navigation:

```typescript
import { router } from '@inertiajs/react';

router.visit(route('bookings.index'));
```

## Forms

Use Inertia's `useForm` for all server-bound forms. This handles field values, errors, submission state, and flash messages automatically:

```typescript
const form = useForm({
    start: '',
    end: '',
    room_ids: [] as number[],
});

function submit(e: FormEvent) {
    e.preventDefault();
    form.post(route('bookings.store'));
}
```

Form errors come back from Laravel validation and are available as `form.errors.fieldName`.

## UI components

Radix UI primitives are wrapped in `components/ui/` with project-specific Tailwind styles. Always use these wrappers — don't import Radix directly from pages or feature components:

```typescript
// Good
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';

// Avoid
import * as RadixDialog from '@radix-ui/react-dialog';
```

## Tailwind CSS v4

- Use utility classes from Tailwind; avoid writing custom CSS
- Check existing components for patterns before adding new classes
- Dark mode is supported via the `dark:` variant; test both modes
- Always use `search-docs` for Tailwind v4 specifics — v4 has significant API changes from v3

## Deferred props pattern

For expensive data that doesn't need to block the initial render, use Inertia deferred props with skeleton placeholders:

```typescript
// Backend (controller)
'todayActivity' => Inertia::defer(fn () => app(BuildTodayActivity::class)()),

// Frontend (page)
import { Deferred } from '@inertiajs/react';

<Deferred data="todayActivity" fallback={<StatCardSkeleton />}>
    <TodayActivityCard activity={todayActivity} />
</Deferred>
```

Always provide a skeleton fallback — the `StatCardSkeleton` component in `components/dashboard/` is the standard pattern.

## Code style

Before committing:

```bash
vendor/bin/sail yarn run format    # Prettier
vendor/bin/sail yarn run lint      # ESLint
```

- `async/await` over `.then()` chains
- Functional components only — no class components
- React Compiler is enabled (`babel-plugin-react-compiler`) — this handles memoization automatically; avoid manual `useMemo`/`useCallback` unless profiling shows a specific need
