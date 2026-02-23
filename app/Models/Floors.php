<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Floors extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'buildings_id',
        'hotels_id',
    ];

    public function buildings(): BelongsTo
    {
        return $this->belongsTo(Buildings::class);
    }

    public function hotels(): BelongsTo
    {
        return $this->belongsTo(Hotels::class);
    }
}
