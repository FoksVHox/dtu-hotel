<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Hotel extends Model
{
    use HasFactory;

    protected $table = 'hotels';

    protected $fillable = [
        'name',
        'cvr',
        'phone',
        'email',
        'domain',
        'address',
        'currency',
    ];

    public function buildings(): HasMany
    {
        return $this->hasMany(Building::class, 'hotels_id');
    }

    public function floors(): HasMany
    {
        return $this->hasMany(Floor::class, 'hotels_id');
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class, 'hotels_id');
    }
}
