<?php

namespace App\Enums;

enum ApplicationStatus: string
{
    case Pending = 'pending';
    case Shortlisted = 'shortlisted';
    case Rejected = 'rejected';
    case Approved = 'approved';

    /**
     * The English label shown to administrators.
     */
    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Shortlisted => 'Shortlisted',
            self::Rejected => 'Rejected',
            self::Approved => 'Approved',
        };
    }
}
