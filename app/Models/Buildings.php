<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Buildings extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'address',
        'phone',
        'code',
        'hotels_id',
    ];

    public function hotels(): BelongsTo
    {
        return $this->belongsTo(Hotels::class);
    }
}
