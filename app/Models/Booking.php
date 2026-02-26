<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'start',
        'end',
        'status',
    ];

    public function rooms(): BelongsToMany
    {
        return $this->belongsToMany(Room::class);
    }

    public function guests(): BelongsToMany
    {
        // Migration creates `guest_booking` (not Laravel's default `booking_guest`).
        return $this->belongsToMany(Guest::class, 'guest_booking');
    }

    // 'datetime' cast stores values as Carbon instances in PHP and serializes to ISO 8601 strings
    // (e.g. "2026-02-23T14:00:00.000000Z") in JSON. The previous 'timestamp' cast produced Unix
    // integers which the frontend couldn't use directly.
    protected function casts(): array
    {
        return [
            'start' => 'datetime',
            'end' => 'datetime',
        ];
    }
}
