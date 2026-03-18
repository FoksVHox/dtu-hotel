<?php

namespace App\Enums;

// Room status badge component #37

enum RoomStatus: int
{
    case undefined = 0;
    case Available = 1;
    case Occupied = 2;
    case Cleaning = 3;
    case OutOfOrder = 4;

    public function label(): string
    {
        return match ($this) {
            self::undefined => 'Undefined',
            self::Available => 'Available',
            self::Occupied => 'Occupied',
            self::Cleaning => 'Cleaning',
            self::OutOfOrder => 'Out of Order',
        };
    }
}
