<?php

namespace App\Http\Controllers;

use App\Models\Guest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchGuestsController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $query = $request->string('q')->trim()->value();

        if (strlen($query) < 1) {
            return response()->json([]);
        }

        $lowerQuery = strtolower($query);

        $guests = Guest::query()
            ->where(function ($q) use ($query) {
                $q->whereLike('first_name', "%{$query}%")
                    ->orWhereLike('last_name', "%{$query}%")
                    ->orWhereLike('email', "%{$query}%");
            })
            ->select(['id', 'first_name', 'last_name', 'email', 'phone'])
            ->orderByRaw('
                CASE
                    WHEN LOWER(first_name) LIKE ? THEN 0
                    WHEN LOWER(last_name) LIKE ? THEN 1
                    WHEN LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? THEN 2
                    ELSE 3
                END
            ', [
                $lowerQuery.'%',
                $lowerQuery.'%',
                '%'.$lowerQuery.'%',
                '%'.$lowerQuery.'%',
            ])
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        return response()->json($guests);
    }
}
