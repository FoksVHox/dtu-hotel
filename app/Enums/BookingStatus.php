<?php

namespace App\Enums;

enum BookingStatus: int
{
    case Unknown = 0;
    case Pending = 1;
    case Confirmed = 2;
    case CheckedIn = 3;
    case CheckedOut = 4;
    case Cancelled = 5;
    case Maintenance = 6;

    public function label(): string
    {
        return match ($this) {
            self::Unknown => 'Unknown',
            self::Pending => 'Pending',
            self::Confirmed => 'Confirmed',
            self::CheckedIn => 'Checked In',
            self::CheckedOut => 'Checked Out',
            self::Cancelled => 'Cancelled',
            self::Maintenance => 'Maintenance',
        };
    }
}
