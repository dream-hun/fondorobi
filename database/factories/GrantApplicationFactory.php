<?php

namespace Database\Factories;

use App\Enums\EducationLevel;
use App\Enums\Industry;
use App\Enums\Province;
use App\Models\GrantApplication;
use App\Services\GrantApplicationScorer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GrantApplication>
 */
class GrantApplicationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $province = fake()->randomElement(Province::cases());
        $district = fake()->randomElement($province->districts());
        $dateOfBirth = fake()->dateTimeBetween('-60 years', '-20 years');
        $plannedJobs = fake()->numberBetween(0, 12);
        $budgetItems = [
            ['description' => 'Imashini zidoda', 'quantity' => '2', 'amount' => 3_000_000],
            ['description' => 'Ibikoresho by\'ibanze', 'quantity' => '1', 'amount' => 2_000_000],
        ];

        return [
            'full_name' => fake()->name('female'),
            'date_of_birth' => $dateOfBirth,
            'national_id' => '1'.$dateOfBirth->format('Y').'7'.fake()->unique()->numerify('##########'),
            'phone' => fake()->unique()->numerify('078#######'),
            'email' => fake()->optional()->safeEmail(),
            'province' => $province,
            'district' => $district,
            'sector' => fake()->word(),
            'cell' => fake()->word(),
            'village' => fake()->word(),
            'is_team' => false,
            'is_woman_led' => true,
            'is_adult' => true,
            'has_operated_one_year' => true,
            'is_main_occupation' => fake()->boolean(),
            'can_continue_without_grant' => fake()->boolean(),
            'creates_jobs' => fake()->boolean(),
            'education_level' => fake()->randomElement(EducationLevel::cases()),
            'education_level_other' => null,
            'has_related_training' => false,
            'previous_work' => fake()->sentence(),
            'received_previous_support' => false,
            'has_assets' => false,
            'grant_need' => fake()->paragraph(),
            'expected_impact' => fake()->paragraph(),
            'business_name' => fake()->company(),
            'industry' => fake()->randomElement(array_filter(Industry::cases(), fn (Industry $industry): bool => $industry !== Industry::Other)),
            'business_years_operating' => fake()->numberBetween(1, 10),
            'business_district' => $district,
            'business_sector' => fake()->word(),
            'business_summary' => fake()->paragraph(),
            'planned_jobs' => $plannedJobs,
            'planned_jobs_for_women' => fake()->numberBetween(0, $plannedJobs),
            'budget_items' => $budgetItems,
            'budget_total' => 5_000_000,
            'will_submit_business_plan' => fake()->boolean(),
            'signature_name' => fake()->name('female'),
        ];
    }

    /**
     * Configure the model factory.
     */
    public function configure(): static
    {
        return $this->afterMaking(fn (GrantApplication $application) => app(GrantApplicationScorer::class)->assess($application));
    }

    /**
     * An application that meets every scoring criterion.
     */
    public function highlyQualified(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_main_occupation' => true,
            'can_continue_without_grant' => true,
            'creates_jobs' => true,
            'business_years_operating' => 5,
            'planned_jobs' => 10,
            'planned_jobs_for_women' => 6,
            'has_related_training' => true,
            'related_training_details' => 'Amahugurwa y\'ubudozi',
            'has_assets' => true,
            'assets_details' => 'Imashini ebyiri',
            'received_previous_support' => false,
            'will_submit_business_plan' => true,
        ]);
    }

    /**
     * An application that fails a mandatory eligibility rule.
     */
    public function ineligible(): static
    {
        return $this->state(fn (array $attributes) => [
            'has_operated_one_year' => false,
            'business_years_operating' => 0,
        ]);
    }
}
