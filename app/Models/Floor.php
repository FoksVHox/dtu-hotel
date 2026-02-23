<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Floor extends Model
{
    use HasFactory;

    protected $table = 'floors';

    protected $fillable = [
        'name',
        'code',
        'buildings_id',
        'hotels_id',
    ];

    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class, 'buildings_id');
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class, 'hotels_id');
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class, 'floors_id');
    }
}
