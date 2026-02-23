<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Rooms extends Model
{
    use HasFactory;

    protected $fillable = [
        'hotels_id',
        'buildings_id',
        'floors_id',
        'room_category_id',
    ];

    public function hotels(): BelongsTo
    {
        return $this->belongsTo(Hotels::class);
    }

    public function buildings(): BelongsTo
    {
        return $this->belongsTo(Buildings::class);
    }

    public function floors(): BelongsTo
    {
        return $this->belongsTo(Floors::class);
    }

    public function roomCategory(): BelongsTo
    {
        return $this->belongsTo(RoomCategory::class);
    }

    public function roomAccessories(): BelongsToMany
    {
        return $this->belongsToMany(RoomAccessory::class, 'room_accessory_room', 'rooms_id', 'room_accessory_id');
    }

    public function bookings(): BelongsToMany
    {
        return $this->belongsToMany(Bookings::class, 'booking_room', 'rooms_id', 'bookings_id');
    }
}
