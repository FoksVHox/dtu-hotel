<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Room extends Model
{
    use HasFactory;

    protected $table = 'rooms';

    protected $fillable = [
        'hotels_id',
        'buildings_id',
        'floors_id',
        'room_category_id',
    ];

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class, 'hotels_id');
    }

    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class, 'buildings_id');
    }

    public function floor(): BelongsTo
    {
        return $this->belongsTo(Floor::class, 'floors_id');
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
        return $this->belongsToMany(Booking::class, 'booking_room', 'rooms_id', 'bookings_id');
    }
}
