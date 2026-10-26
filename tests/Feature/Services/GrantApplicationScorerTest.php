<?php

use App\Models\GrantApplication;
use App\Services\GrantApplicationScorer;

/**
 * The points an application earns for one scoring criterion.
 */
function pointsFor(GrantApplication $application, string $criterion): int
{
    return collect(app(GrantApplicationScorer::class)->breakdown($application))
        ->firstWhere('criterion', $criterion)['points'];
}

test('business age earns points by maturity band', function (int $years, int $points) {
    $application = GrantApplication::factory()->make(['business_years_operating' => $years]);

    expect(pointsFor($application, 'Years the business has operated'))->toBe($points);
})->with([
    'under one year' => [0, 0],
    'one year' => [1, 5],
    'three years' => [3, 10],
    'four years' => [4, 15],
]);

test('planned jobs earn points with a bonus when at least half go to women', function (int $jobs, int $forWomen, int $points) {
    $application = GrantApplication::factory()->make(['planned_jobs' => $jobs, 'planned_jobs_for_women' => $forWomen]);

    expect(pointsFor($application, 'New jobs planned (bonus when at least half go to women)'))->toBe($points);
})->with([
    'no jobs' => [0, 0, 0],
    'two jobs, none for women' => [2, 0, 6],
    'two jobs, half for women' => [2, 1, 11],
    'five jobs, two for women' => [5, 2, 10],
    'six jobs, all for women' => [6, 6, 18],
    'ten jobs, half for women' => [10, 5, 20],
]);

test('the budget earns full points only when it uses the whole grant', function (int $total, int $points) {
    $application = GrantApplication::factory()->make(['budget_total' => $total]);

    expect(pointsFor($application, 'Budget uses the full grant amount'))->toBe($points);
})->with([
    'whole grant' => [5_000_000, 10],
    'eighty percent' => [4_000_000, 5],
    'below eighty percent' => [3_999_999, 0],
]);

test('an applicant who turned 18 only after submitting is still not eligible', function () {
    $this->travelTo('2026-10-01');
    $application = GrantApplication::factory()->create(['date_of_birth' => '2008-10-15']);

    $this->travelTo('2027-01-01');

    expect(app(GrantApplicationScorer::class)->ineligibilityReasons($application->fresh()))
        ->toBe(['Applicant is younger than 18 years.']);
});
