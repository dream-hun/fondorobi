<?php

namespace App\Enums;

enum EducationLevel: string
{
    case Primary = 'primary';
    case Secondary = 'secondary';
    case Vocational = 'vocational';
    case University = 'university';
    case Other = 'other';

    /**
     * The Kinyarwanda label shown to applicants.
     */
    public function label(): string
    {
        return match ($this) {
            self::Primary => 'Amashuri abanza',
            self::Secondary => 'Amashuri yisumbuye',
            self::Vocational => 'Amahugurwa y\'imyuga',
            self::University => 'Kaminuza',
            self::Other => 'Ikindi',
        };
    }

    /**
     * The English label shown to administrators.
     */
    public function adminLabel(): string
    {
        return match ($this) {
            self::Primary => 'Primary',
            self::Secondary => 'Secondary',
            self::Vocational => 'Vocational training',
            self::University => 'University',
            self::Other => 'Other',
        };
    }
}
