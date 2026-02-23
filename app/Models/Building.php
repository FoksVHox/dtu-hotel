<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Building extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'address',
        'phone',
        'code',
        'hotel_id',
    ];

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function floors(): HasMany
    {
        return $this->hasMany(Floor::class);
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }
}
