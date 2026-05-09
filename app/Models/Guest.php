<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Guest extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'phone',
        'email',
        'address',
        'date_of_birth',
    ];

    public function bookings(): BelongsToMany
    {
        // Migration creates `guest_booking` (not Laravel's default `booking_guest`).
        return $this->belongsToMany(Booking::class, 'guest_booking');
    }

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
        ];
    }
}
