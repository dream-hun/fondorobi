<?php

namespace App\Enums;

enum Qualification: string
{
    case High = 'high';
    case Medium = 'medium';
    case Low = 'low';
    case NotEligible = 'not_eligible';

    /**
     * Resolve the qualification tier for an eligible application's score.
     */
    public static function fromScore(int $score): self
    {
        return match (true) {
            $score >= 70 => self::High,
            $score >= 50 => self::Medium,
            default => self::Low,
        };
    }

    /**
     * The English label shown to administrators.
     */
    public function label(): string
    {
        return match ($this) {
            self::High => 'Highly qualified',
            self::Medium => 'Medium',
            self::Low => 'Low',
            self::NotEligible => 'Not eligible',
        };
    }
}
