<?php

namespace App\Models\Concerns;

use App\Models\Hotel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

trait BelongsToHotel
{
    public static function bootBelongsToHotel(): void
    {
        static::addGlobalScope('hotel', function (Builder $query): void {
            if (! auth()->hasUser()) {
                return;
            }

            $hotelId = auth()->user()->hotel_id ?? null;

            if ($hotelId === null) {
                return;
            }

            $query->where($query->getModel()->qualifyColumn('hotel_id'), $hotelId);
        });

        static::creating(function (Model $model): void {
            if ($model->hotel_id !== null) {
                return;
            }

            if (! auth()->hasUser()) {
                return;
            }

            $hotelId = auth()->user()->hotel_id ?? null;

            if ($hotelId !== null) {
                $model->hotel_id = $hotelId;
            }
        });
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function scopeWithoutHotelScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope('hotel');
    }
}
