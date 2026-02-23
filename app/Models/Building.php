<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Building extends Model
{
    use HasFactory;

    protected $table = 'buildings';

    protected $fillable = [
        'name',
        'address',
        'phone',
        'code',
        'hotels_id',
    ];

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class, 'hotels_id');
    }

    public function floors(): HasMany
    {
        return $this->hasMany(Floor::class, 'buildings_id');
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class, 'buildings_id');
    }
}
