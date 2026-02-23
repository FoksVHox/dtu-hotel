<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Bookings extends Model
{
    use HasFactory;

    protected $fillable = [
        'start',
        'end',
        'status',
    ];

    public function rooms(): BelongsToMany
    {
        return $this->belongsToMany(Rooms::class, 'booking_room', 'bookings_id', 'rooms_id');
    }

    public function guests(): BelongsToMany
    {
        return $this->belongsToMany(Guests::class, 'guest_booking', 'bookings_id', 'guests_id');
    }

    protected function casts(): array
    {
        return [
            'start' => 'timestamp',
            'end' => 'timestamp',
        ];
    }
}
