# Authentication

## Overview

Authentication is handled by **Laravel Fortify** — a headless backend that provides routes and logic without any built-in views. Views are wired to Inertia React pages in `FortifyServiceProvider`.

## Fortify setup (`app/Providers/FortifyServiceProvider.php`)

### Actions

Fortify delegates user creation and password reset to action classes:

- `CreateNewUser` (`app/Actions/Fortify/CreateNewUser.php`) — handles `POST /register`
- `ResetUserPassword` (`app/Actions/Fortify/ResetUserPassword.php`) — handles `POST /reset-password`

### Views

Fortify views are bound to Inertia renders:

| Fortify view | Inertia page |
|---|---|
| Login | `auth/login` |
| Register | `auth/register` |
| Password reset request | `auth/forgot-password` |
| Password reset | `auth/reset-password` |
| Email verification | `auth/verify-email` |
| 2FA challenge | `auth/two-factor-challenge` |
| Confirm password | `auth/confirm-password` |

Each binding passes relevant context (e.g., `canResetPassword`, `status` flash message) as Inertia props.

## Rate limiting

Defined in `FortifyServiceProvider::configureRateLimiting()`:

| Limiter | Limit | Key |
|---------|-------|-----|
| `login` | 5/min | transliterated lowercase email + IP |
| `two-factor` | 5/min | session login ID |
| `user-password.update` | 6/min | (set in `routes/settings.php`) |

## Route middleware

Authenticated routes use:

```php
Route::middleware(['auth', 'verified'])->group(function () {
    // dashboard, bookings, rooms, maintenance
});
```

- `auth` — must be logged in
- `verified` — email must be verified (Fortify provides the verification flow)

Settings routes split on `verified`:

```php
// Profile edit/update — auth only (unverified users can still edit profile)
Route::middleware(['auth'])->group(...)

// Password, appearance, 2FA — auth + verified
Route::middleware(['auth', 'verified'])->group(...)
```

## Two-factor authentication

2FA uses TOTP (time-based one-time passwords) via the `TwoFactorAuthenticatable` trait on `User`.

Setup flow (`settings/two-factor`):
1. User enables 2FA via `TwoFactorAuthenticationController`
2. QR code shown in `two-factor-setup-modal.tsx`
3. User confirms with an OTP — sets `two_factor_confirmed_at`
4. Recovery codes shown in `two-factor-recovery-codes.tsx`

Login flow:
1. After correct password, Fortify checks if 2FA is confirmed
2. If yes, redirects to `auth/two-factor-challenge`
3. OTP or recovery code is submitted to complete login

## User model

`User` uses `Laravel\Fortify\TwoFactorAuthenticatable` trait for 2FA columns. Two-factor columns (`two_factor_secret`, `two_factor_recovery_codes`) are in the `$hidden` array and never included in JSON serialization.

## Registration feature flag

Registration can be toggled via `Features::registration()`. The welcome page and login page check `Features::enabled(Features::registration())` to show/hide the register link.
