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

    protected function casts(): array
    {
        return [
            'start' => 'timestamp',
            'end' => 'timestamp',
        ];
    }

    
}
