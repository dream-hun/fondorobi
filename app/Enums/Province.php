<?php

namespace App\Enums;

enum Province: string
{
    case Kigali = 'kigali';
    case North = 'north';
    case South = 'south';
    case East = 'east';
    case West = 'west';

    /**
     * The Kinyarwanda name of the province.
     */
    public function label(): string
    {
        return match ($this) {
            self::Kigali => 'Umujyi wa Kigali',
            self::North => 'Amajyaruguru',
            self::South => 'Amajyepfo',
            self::East => 'Iburasirazuba',
            self::West => 'Iburengerazuba',
        };
    }

    /**
     * The districts (Uturere) that belong to the province.
     *
     * @return list<string>
     */
    public function districts(): array
    {
        return match ($this) {
            self::Kigali => ['Gasabo', 'Kicukiro', 'Nyarugenge'],
            self::North => ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo'],
            self::South => ['Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango'],
            self::East => ['Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana'],
            self::West => ['Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro'],
        };
    }

    /**
     * Every district in Rwanda.
     *
     * @return list<string>
     */
    public static function allDistricts(): array
    {
        return array_merge(...array_map(fn (self $province): array => $province->districts(), self::cases()));
    }

    /**
     * The provinces with their districts, shaped for the frontend.
     *
     * @return list<array{value: string, label: string, districts: list<string>}>
     */
    public static function options(): array
    {
        return array_map(fn (self $province): array => [
            'value' => $province->value,
            'label' => $province->label(),
            'districts' => $province->districts(),
        ], self::cases());
    }
}
