<?php

namespace App\Enums;


enum RoomStatus: int
{
    case Available = 0;
    case Occupied = 1;
    case Cleaning = 2;
    case OutOfOrder = 3;

    public function label(): string
    {
        return match ($this) {
            self::Available => 'Available',
            self::Occupied => 'Occupied',
            self::Cleaning => 'Cleaning',
            self::OutOfOrder => 'Out of Order',
        };
    }
}
