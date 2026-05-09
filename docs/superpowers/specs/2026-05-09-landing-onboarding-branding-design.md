# Landing, Onboarding, and Branding — Design

**Date:** 2026-05-09
**Branch:** fix/dashboard-fixes (will branch off into a new feature branch for implementation)
**Author:** Hussein
**Status:** Approved for implementation

## Summary

Build the missing "entry experience" of the dtu-hotel SaaS in a single day:

1. A new public landing page at `/` (replaces existing `welcome.tsx`).
2. A multi-step onboarding wizard at `/onboarding` that collects hotel info, building/floor structure, and the first rooms.
3. Retrofit multi-tenancy so each user owns one hotel and only sees their own data.
4. Custom brand mark + favicon to replace the Laravel-default mark across the product.

Sign-in / sign-up / password-reset pages are **untouched** — they are already polished by the Fortify scaffolding. The auth pages will pick up the new brand mark automatically since they share `app-logo-icon.tsx`.

## Goals & non-goals

**Goals**

- A user who lands on `/` understands what dtu-hotel is and can sign up in one click.
- A new user signing up is guided through creating their hotel, building/floors, and first rooms — and lands on a non-empty dashboard.
- Existing teammates' user accounts are not touched. They go through the new onboarding next time they log in.
- Once a user is onboarded, the app enforces single-hotel scoping in every list/show query.
- The product visually reads as DTU Hotel, not as Laravel + Tailwind defaults.

**Non-goals**

- Real billing, real pricing tiers.
- Email verification gate. We disable `Features::emailVerification()` in `config/fortify.php` and drop `verified` middleware from the dashboard group. Verification can be re-enabled later in one config line.
- Staff invites / multi-user-per-hotel. The wizard step exists as a "Coming soon" stub.
- Many-to-many users-to-hotels.
- Restyling the Fortify auth pages, 2FA, verify-email, confirm-password, recovery-code screens.
- Backfilling `hotel_id` on `room_categories` (stays a global catalog for today).
- Browser / E2E / visual regression tests.

## Tenancy model

**Decision:** 1 user owns 1 hotel.

A `User` has a nullable `hotel_id` foreign key to `hotels`. A user is "onboarded" once `users.onboarded_at` is set; until then the middleware redirects them to `/onboarding`.

`Hotel` has one owner (the user with `hotel_id` pointing at it). The two seeded hotels (North Harbor, Aurora Stay) become ownerless ghost data after the migration — left alone, harmless, can be wiped later.

### Schema changes (single migration)

| Table | Column | Notes |
|---|---|---|
| `users` | `hotel_id` (foreignId, nullable, nullOnDelete) | Existing users keep `null`. |
| `users` | `onboarded_at` (timestamp, nullable) | Set in `OnboardingController@complete`. |
| `bookings` | `hotel_id` (foreignId, nullable→NOT NULL after backfill) | Backfill via `booking_room → rooms.hotel_id`. |
| `guests` | `hotel_id` (foreignId, nullable→NOT NULL after backfill) | Backfill via `guest_booking → bookings → rooms.hotel_id`. |
| `maintenance_logs` | `hotel_id` (foreignId, nullable→NOT NULL after backfill) | Backfill via `room.hotel_id`. |

Rows that cannot be backfilled (e.g. a guest never attached to any booking) keep `hotel_id = null`. Scoped queries naturally exclude them.

### Model changes

- `User`: add `hotel(): BelongsTo`, helper `hasOnboarded(): bool`. Add `hotel_id` and `onboarded_at` to `$fillable`/`casts()` as appropriate.
- `Hotel`: add `owner(): HasOne` (inverse of `users.hotel_id`), `bookings(): HasMany`, `guests(): HasMany`, `maintenanceLogs(): HasMany`.
- `Booking`, `Guest`, `MaintenanceLog`: add `hotel(): BelongsTo`, add `hotel_id` to `$fillable`, use the new `BelongsToHotel` trait (see below).

### Scoping mechanism

A new `App\Models\Concerns\BelongsToHotel` trait:

- Boots a global query scope that adds `where hotel_id = auth()->user()->hotel_id` whenever a request is authenticated and the current user has a hotel.
- Provides a public `withoutHotelScope()` static helper for the seeders, factories, and any console/job context where there's no auth user.
- Exposes a `hotel(): BelongsTo` relationship.

Applied to: `Booking`, `Guest`, `MaintenanceLog`, `Room` (Room already has `hotel_id`; we just opt it into the trait so its global scope kicks in too).

### Seeder changes

- `UserSeeder`: keep as-is; existing seeded users stay unowned (correct outcome).
- `HotelStructureSeeder`: keep as-is; structural test data remains for whoever wants to inspect it.
- `RoomCategorySeeder` (or inline in `OnboardingController`): the four default categories (`Single`, `Double`, `Suite`, `Family`) are `firstOrCreate`d on the first onboarding ever, so the catalog exists. Subsequent onboarders reuse the same global rows.

## Routes

```
GET   /                       welcome (public, replaced component)
GET   /onboarding             OnboardingController@show              (auth)
POST  /onboarding/hotel       OnboardingController@storeHotel        (auth)
POST  /onboarding/buildings   OnboardingController@storeBuildings    (auth)
POST  /onboarding/rooms       OnboardingController@storeRooms        (auth)
POST  /onboarding/complete    OnboardingController@complete          (auth)
```

The dashboard group (`/dashboard`, `/bookings`, `/rooms`, `/maintenance`, `/guests/search`) currently uses `auth + verified`. We change it to `auth + ensure.hotel.onboarded` — `verified` is dropped because the project decision is "no email verification required". The settings group (`routes/settings.php`) gets the same treatment.

The onboarding group is `auth`-only — deliberately not behind `EnsureHotelOnboarded`, otherwise that middleware would redirect onboarding routes back to themselves.

### Fortify config change

`config/fortify.php`: remove `Features::emailVerification()` from the features array. Existing seeded users have `email_verified_at = now()` (set by `UserFactory`) so removing the feature has no effect on them. New users registering through the wizard will have `email_verified_at = null` and that's fine since nothing checks it.

## Middleware: `EnsureHotelOnboarded`

Registered in `bootstrap/app.php` as `ensure.hotel.onboarded`.

```
if (auth user && auth user->onboarded_at === null) {
    if (request not to /onboarding/*) redirect /onboarding;
}
if (auth user && auth user->onboarded_at !== null) {
    if (request to /onboarding/*) redirect /dashboard;
}
```

(Inverse-direction logic is implemented at the controller level for `/onboarding` GET, since that route doesn't carry the middleware. Cleanest place is `OnboardingController@show` short-circuiting if `hasOnboarded()`.)

## OnboardingController

Single controller, five actions. Each store action takes a Form Request. Array-style validation rules to match project convention.

### `show()`

Computes `currentStep` based on user state:

| State | currentStep |
|---|---|
| no `hotel_id` | 1 (Hotel basics) |
| has hotel, no buildings | 2 (Buildings & floors) |
| has buildings, no rooms | 3 (Rooms) |
| has rooms, no `onboarded_at` | 4 (Invite teammates) |
| `onboarded_at` set | (redirect to `/dashboard`) |

Renders an Inertia page `onboarding/wizard.tsx` with props: `currentStep`, `hotel`, `buildings` (with floors), `categories`.

### `storeHotel(StoreOnboardingHotelRequest)`

Validates: `name` required string, `email` required email, `phone` required string, `cvr` required string, `address` required string, `currency` required `in:DKK,EUR,USD`.

Creates `Hotel`, sets `auth user->hotel_id = hotel->id`, persists. Returns Inertia redirect to `/onboarding` (resume logic now sends them to step 2).

### `storeBuildings(StoreOnboardingBuildingsRequest)`

Validates: `buildings` array `min:1 max:10`, each `buildings.*.name` required string, each `buildings.*.floors_count` integer `between:1,20`.

For each building: create `Building` with `hotel_id = auth user->hotel_id`. For each, auto-create `Floor` rows numbered 1..N.

If buildings/floors already exist for this hotel (user redoing the step), the action wipes the hotel's existing buildings/floors first, then recreates from the new payload. (Acceptable for school demo; pre-onboarded state.)

### `storeRooms(StoreOnboardingRoomsRequest)`

Validates: `rules` array `min:1 max:10`, each rule:
- `start_number` integer `min:1`
- `end_number` integer `gte:start_number` and `(end_number - start_number) <= 49` (so each rule ≤ 50 rooms)
- `floor_id` integer `exists:floors,id` (and must belong to one of the user's hotel's floors)
- `category_id` integer `exists:room_categories,id`

Ensures default categories exist (`firstOrCreate` — see Seeder section). For each rule, expands `start_number..end_number` into a Room row with `hotel_id`, `floor_id`, `category_id`, `number`. Uses bulk `Room::insert` for efficiency. Attaches accessories: none for now.

If rooms already exist for this hotel, wipe-and-recreate as in `storeBuildings`.

### `complete()`

Sets `auth user->onboarded_at = now()`. Redirect to `/dashboard` with a one-time flash: `Welcome to DTU Hotel — your hotel is ready.`

## Onboarding wizard UX (`resources/js/pages/onboarding/wizard.tsx`)

**Shell:** full-screen, no sidebar, no app header. Centered ~640px column on a clean black/white background. Brand mark top-left. "Sign out" link top-right.

**Step indicator:** horizontal stepper at the top showing 4 dots (Hotel · Buildings · Rooms · Invite). Current step filled. Completed steps checked. Click-to-jump only allowed on completed steps.

**Step 1 — Hotel basics.** Form fields in order: Name, Email, Phone, CVR, Address, Currency (select: DKK / EUR / USD, default DKK). All required. Submit button: "Continue".

**Step 2 — Buildings & floors.** Pre-seeded with one row: `Main Building, 1 floor`. Stacked editable list of `{ name, floors_count }` rows. "Add another building" button. Submit: "Continue".

**Step 3 — Rooms (bulk rule composer).** Each rule reads naturally:

> Create rooms numbered `[101]` to `[110]` on Floor `[1]` of `[Main Building]` with category `[Single]`

"Add another rule" button (max 10). Submit: "Continue". Server expands rules into Room rows.

**Step 4 — Invite teammates (skip-able stub).** Polished "Coming soon" panel with an icon, headline "Invite your team — coming soon", body explaining staff accounts are coming. Two buttons: "Skip for now" (primary) and "Back". Either button hits POST `/onboarding/complete`. Skip *is* finish.

**On complete:** redirect to `/dashboard` with a flash success message.

**"Wow" moment (optional, nice-to-have):** transition between step 2 and step 3 briefly animates the just-created building/floors into the grid that becomes the room canvas. Subtle. Cut if running short.

## Landing page (`resources/js/pages/welcome.tsx`)

Single scrolling page, three sections, full black/white aesthetic. **No accent color.** CTA hierarchy via type weight, size, and ink-fills.

### Hero

- Top nav bar: brand mark left ("DTU Hotel" wordmark), `Sign in` text link + `Get started` filled-black button right.
- Asymmetric two-column layout — text 60% left, product visual 40% right.
- Headline: large display type, two lines max. Working draft: *"Run your hotel, not your spreadsheet."* (Iterate during implementation.)
- Subhead: one line, ~12 words.
- Primary CTA: filled-black button "Get started" → `/register`. Secondary: text link "Sign in" → `/login`.
- Right column: an animated mini-calendar showing a week strip with bookings rendering in. Rendered in **greyscale** on the landing — color is reserved for the in-product experience, so signing up "earns" the color reveal.

### Features (2x2 grid on desktop, stacked on mobile)

Each block: a real cropped product screenshot (greyscale-treated to match the landing), heading, ~2 lines of body. Four blocks pulling from real product capabilities:

1. **Booking calendar** (uses the calendar feature finished 2026-05-08).
2. **Room operations**.
3. **Maintenance log**.
4. **Guests**.

### Footer

- Brand mark + tagline.
- Three short link columns: Product (Sign in, Get started), Resources (placeholder "Coming soon" stubs), Legal (Terms / Privacy stubs — link targets are placeholder pages or `#`).
- Bottom row: copyright + "Built at DTU."

### Avoiding generic-AI aesthetics

- No purple-blue-cyan gradients.
- No floating glowing orbs / blur halos.
- No generic icon set (no checkmark-in-circle, no "rocket launch").
- Real product screenshots, not abstract illustrations.
- Typography does the heavy lifting: large display headline, varied weights, generous whitespace.

## Branding (`app-logo-icon.tsx` + favicon files)

**Single source of truth.** `resources/js/components/app-logo-icon.tsx` is imported by:

- `app-sidebar.tsx`
- `app-header.tsx` (twice)
- `auth-card-layout.tsx`
- `auth-split-layout.tsx`
- `auth-simple-layout.tsx`

Replacing this one file rebrands the whole product including the auth pages.

**Mark concept.** A bold geometric monogram **"H"**:

- Single black fill, square viewBox.
- Horizontal bar offset slightly above center, leaving a small rectangular negative space at the bottom that subtly reads as a doorway.
- Tall x-height for presence at favicon size.
- Generous interior padding so it works inside the rounded-square sidebar treatment.
- No thin strokes (must remain readable at 16×16).

**Static assets to replace:**

- `public/favicon.svg` — same SVG, single-color black.
- `public/favicon.ico` — generated from the SVG (16, 32, 48 sizes).
- `public/apple-touch-icon.png` — PNG export at 180×180.

**Wordmark wrapper** `app-logo.tsx` already renders "DTU Hotel" — unchanged.

## Error handling & edge cases

| Case | Behavior |
|---|---|
| Mid-wizard refresh / re-login | `show` recomputes step from related-row existence. Idempotent. |
| Two tabs open during wizard | Both POSTs land. Second hits validation if resource exists. Acceptable. |
| User with `hotel_id` but no `onboarded_at` hits `/dashboard` | Middleware redirects to `/onboarding`. |
| Onboarded user hits `/onboarding` | `show` short-circuits with redirect to `/dashboard`. |
| Logged-out user hits `/onboarding` or `/dashboard` | Fortify `auth` middleware redirects to `/login`. |
| Migration backfill fails for a row | Stays `hotel_id = null`. Scoped queries exclude it. |
| First-ever user, no room categories | `firstOrCreate` defaults at start of `storeRooms` (or in `show` for step 3 prop). |
| Validation failures | Form Requests return 422; React `useForm` surfaces inline errors. |
| Step 3 abuse (1000s of rooms) | Hard caps: ≤ 50 rooms per rule, ≤ 10 rules. Server-enforced. |

## Testing plan (Pest 4)

Tests are scoped to "prove the new logic works", not exhaustive. Use existing factories where possible; extend factories with hotel-aware states.

### Middleware — `EnsureHotelOnboardedTest`

- Authed user with `hotel_id = null` visiting `/dashboard` → redirect to `/onboarding`.
- Authed user with hotel but `onboarded_at = null` visiting `/dashboard` → redirect to `/onboarding`.
- Authed user fully onboarded visiting `/onboarding` → redirect to `/dashboard`.
- Authed onboarded user visiting `/dashboard` → 200.

### Onboarding flow — `OnboardingFlowTest`

- `show` returns correct `currentStep` for each of the four states.
- `storeHotel` creates a Hotel, sets `users.hotel_id`, leaves `onboarded_at` null.
- `storeBuildings` creates buildings + auto-numbered floors.
- `storeRooms` expands a rule into N Room rows with correct floor + category links.
- `complete` sets `onboarded_at = now()` and redirects to `/dashboard`.

### Validation — one test per Form Request

- `StoreOnboardingHotelRequest`: required fields, currency `in` rule.
- `StoreOnboardingBuildingsRequest`: min 1 building, floors_count between 1 and 20.
- `StoreOnboardingRoomsRequest`: rule range cap, ≤ 10 rules.

### Tenancy scoping — `HotelScopingTest`

Seed two hotels each with their own user, building, room, booking, guest, maintenance log.

- Acting as Hotel A's user, `GET /bookings` returns only Hotel A's bookings.
- Same for `/rooms`, `/maintenance`, `/guests/search`.
- Acting as Hotel A's user, `GET /bookings/{id}` for Hotel B's booking → 404.

### Out of scope today

- Browser / E2E tests.
- Visual regression.
- Re-testing Fortify auth flows (already covered upstream).

## Implementation order (suggested)

1. Migration + model trait + middleware + Fortify config (drop `emailVerification`) + routes middleware swap (drop `verified`, add `ensure.hotel.onboarded`) + tenancy scoping in controllers (with tests).
2. `OnboardingController` skeleton + Form Requests + tests for each store action.
3. New `app-logo-icon.tsx` SVG + favicon files (visible immediately everywhere).
4. Onboarding wizard React page (step shell, step 1).
5. Steps 2 + 3 + 4.
6. Landing page.
7. Manual smoke test: log in as a seeded user → redirected to `/onboarding` → complete wizard → land on dashboard with rooms.
8. Run pint + full test suite.

## Open items deferred

- Adding `hotel_id` to `room_categories` (per-hotel category catalog).
- Real "invite teammates" feature.
- Re-enabling email verification (one config line: re-add `Features::emailVerification()` and `verified` middleware).
- Restyling 2FA / verify-email / confirm-password pages for visual consistency.
- Wiping the two seeded hotels and their orphaned data.
