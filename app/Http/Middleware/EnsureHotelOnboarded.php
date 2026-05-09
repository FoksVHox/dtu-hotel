<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureHotelOnboarded
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return $next($request);
        }

        $isOnboardingRoute = $request->routeIs('onboarding.*');

        if (! $user->hasOnboarded() && ! $isOnboardingRoute) {
            return redirect()->route('onboarding.show');
        }

        if ($user->hasOnboarded() && $isOnboardingRoute) {
            return redirect()->route('dashboard');
        }

        return $next($request);
    }
}
