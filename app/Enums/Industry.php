<?php

namespace App\Enums;

enum Industry: string
{
    case Tailoring = 'tailoring';
    case Food = 'food';
    case Trade = 'trade';
    case SmallManufacturing = 'small_manufacturing';
    case Technology = 'technology';
    case Tourism = 'tourism';
    case Agriculture = 'agriculture';
    case Other = 'other';

    /**
     * The Kinyarwanda label shown to applicants.
     */
    public function label(): string
    {
        return match ($this) {
            self::Tailoring => 'Ubudozi',
            self::Food => 'Ibiribwa',
            self::Trade => 'Ubucuruzi',
            self::SmallManufacturing => 'Inganda nto',
            self::Technology => 'Ikoranabuhanga',
            self::Tourism => 'Ubukerarugendo',
            self::Agriculture => 'Ubuhinzi n\'ubworozi',
            self::Other => 'Ikindi',
        };
    }

    /**
     * The English label shown to administrators.
     */
    public function adminLabel(): string
    {
        return match ($this) {
            self::Tailoring => 'Tailoring',
            self::Food => 'Food',
            self::Trade => 'Trade',
            self::SmallManufacturing => 'Small manufacturing',
            self::Technology => 'Technology',
            self::Tourism => 'Tourism',
            self::Agriculture => 'Agriculture',
            self::Other => 'Other',
        };
    }
}
