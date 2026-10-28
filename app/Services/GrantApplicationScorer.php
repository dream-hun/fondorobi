<?php

namespace App\Services;

use App\Enums\Qualification;
use App\Models\GrantApplication;

class GrantApplicationScorer
{
    /**
     * Assess the application, storing its score and qualification tier on the model.
     */
    public function assess(GrantApplication $application): GrantApplication
    {
        $score = $this->totalScore($application);

        $application->score = $score;
        $application->qualification = $this->ineligibilityReasons($application) === []
            ? Qualification::fromScore($score)
            : Qualification::NotEligible;

        return $application;
    }

    /**
     * The sum of points earned across every scoring criterion (0–100).
     */
    public function totalScore(GrantApplication $application): int
    {
        return array_sum(array_column($this->breakdown($application), 'points'));
    }

    /**
     * The points earned for each scoring criterion.
     *
     * @return list<array{criterion: string, points: int, max: int}>
     */
    public function breakdown(GrantApplication $application): array
    {
        return [
            [
                'criterion' => 'Business is the applicant\'s main daily work',
                'points' => $application->is_main_occupation ? 5 : 0,
                'max' => 5,
            ],
            [
                'criterion' => 'Business would continue without the grant',
                'points' => $application->can_continue_without_grant ? 5 : 0,
                'max' => 5,
            ],
            [
                'criterion' => 'Business employs or will employ others',
                'points' => $application->creates_jobs ? 5 : 0,
                'max' => 5,
            ],
            [
                'criterion' => 'Years the business has operated',
                'points' => $this->businessAgePoints($application->business_years_operating),
                'max' => 15,
            ],
            [
                'criterion' => 'New jobs planned (bonus when at least half go to women)',
                'points' => $this->jobCreationPoints($application->planned_jobs, $application->planned_jobs_for_women),
                'max' => 20,
            ],
            [
                'criterion' => 'Training or certificate related to the business',
                'points' => $application->has_related_training ? 10 : 0,
                'max' => 10,
            ],
            [
                'criterion' => 'Owns land, equipment or other assets',
                'points' => $application->has_assets ? 10 : 0,
                'max' => 10,
            ],
            [
                'criterion' => 'Has not received a grant or support before',
                'points' => $application->received_previous_support ? 0 : 10,
                'max' => 10,
            ],
            [
                'criterion' => 'Budget does not exceed the grant maximum',
                'points' => $this->budgetPoints($application->budget_total),
                'max' => 10,
            ],
            [
                'criterion' => 'Committed to submit a business plan',
                'points' => $application->will_submit_business_plan ? 10 : 0,
                'max' => 10,
            ],
        ];
    }

    /**
     * The mandatory eligibility rules the application fails, if any.
     *
     * @return list<string>
     */
    public function ineligibilityReasons(GrantApplication $application): array
    {
        $reasons = [];

        if (! $application->is_woman_led) {
            $reasons[] = 'Applicant did not confirm being a Rwandan woman or a team with at least 50% women.';
        }

        if ($application->is_team && $application->team_women_count * 2 < $application->team_members_count) {
            $reasons[] = 'Team has fewer than 50% women members.';
        }

        if (! $application->is_adult || $application->age < 18) {
            $reasons[] = 'Applicant is younger than 18 years.';
        }

        if (! $application->has_operated_one_year || $application->business_years_operating < 1) {
            $reasons[] = 'Business has operated for less than one year.';
        }

        return $reasons;
    }

    /**
     * Points for business maturity: 1 year = 5, 2–3 years = 10, 4+ years = 15.
     */
    private function businessAgePoints(int $years): int
    {
        return match (true) {
            $years >= 4 => 15,
            $years >= 2 => 10,
            $years >= 1 => 5,
            default => 0,
        };
    }

    /**
     * Up to 15 points for the number of planned jobs, plus 5 when at least half go to women.
     */
    private function jobCreationPoints(int $plannedJobs, int $jobsForWomen): int
    {
        $points = match (true) {
            $plannedJobs >= 10 => 15,
            $plannedJobs >= 6 => 13,
            $plannedJobs >= 3 => 10,
            $plannedJobs >= 1 => 6,
            default => 0,
        };

        if ($plannedJobs > 0 && $jobsForWomen * 2 >= $plannedJobs) {
            $points += 5;
        }

        return $points;
    }

    /**
     * Full points for any budget up to the grant maximum, so asking for less is never penalized.
     */
    private function budgetPoints(int $budgetTotal): int
    {
        return $budgetTotal > 0 && $budgetTotal <= (int) config('fondo.grant_maximum') ? 10 : 0;
    }
}
