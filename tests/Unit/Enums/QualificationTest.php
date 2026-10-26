<?php

use App\Enums\Qualification;

test('scores map to qualification tiers at the boundaries', function (int $score, Qualification $tier) {
    expect(Qualification::fromScore($score))->toBe($tier);
})->with([
    'top score' => [100, Qualification::High],
    'lowest high' => [70, Qualification::High],
    'highest medium' => [69, Qualification::Medium],
    'lowest medium' => [50, Qualification::Medium],
    'highest low' => [49, Qualification::Low],
    'zero' => [0, Qualification::Low],
]);
