<?php

namespace App\Models;

use App\Enums\ApplicationStatus;
use App\Enums\EducationLevel;
use App\Enums\Industry;
use App\Enums\Province;
use App\Enums\Qualification;
use Carbon\CarbonImmutable;
use Database\Factories\GrantApplicationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $full_name
 * @property CarbonImmutable $date_of_birth
 * @property string $national_id
 * @property string $phone
 * @property string|null $email
 * @property Province $province
 * @property string $district
 * @property string $sector
 * @property string $cell
 * @property string $village
 * @property bool $is_team
 * @property string|null $team_representative_name
 * @property int|null $team_members_count
 * @property int|null $team_women_count
 * @property bool $is_woman_led
 * @property bool $is_adult
 * @property bool $has_operated_one_year
 * @property bool $is_main_occupation
 * @property bool $can_continue_without_grant
 * @property bool $creates_jobs
 * @property EducationLevel $education_level
 * @property string|null $education_level_other
 * @property bool $has_related_training
 * @property string|null $related_training_details
 * @property string $previous_work
 * @property bool $received_previous_support
 * @property string|null $previous_support_details
 * @property bool $has_assets
 * @property string|null $assets_details
 * @property string $grant_need
 * @property string $expected_impact
 * @property string $business_name
 * @property Industry $industry
 * @property string|null $industry_other
 * @property int $business_years_operating
 * @property string $business_district
 * @property string $business_sector
 * @property string $business_summary
 * @property int $planned_jobs
 * @property int $planned_jobs_for_women
 * @property list<array{description: string, quantity: string, amount: int}> $budget_items
 * @property int $budget_total
 * @property bool $will_submit_business_plan
 * @property string $signature_name
 * @property int $score
 * @property Qualification $qualification
 * @property ApplicationStatus $status
 * @property string|null $review_notes
 * @property CarbonImmutable|null $business_plan_received_at
 * @property int|null $reviewed_by
 * @property CarbonImmutable|null $reviewed_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read string $reference
 * @property-read int $age
 */
#[Fillable([
    'full_name', 'date_of_birth', 'national_id', 'phone', 'email',
    'province', 'district', 'sector', 'cell', 'village',
    'is_team', 'team_representative_name', 'team_members_count', 'team_women_count',
    'is_woman_led', 'is_adult', 'has_operated_one_year',
    'is_main_occupation', 'can_continue_without_grant', 'creates_jobs',
    'education_level', 'education_level_other',
    'has_related_training', 'related_training_details', 'previous_work',
    'received_previous_support', 'previous_support_details',
    'has_assets', 'assets_details', 'grant_need', 'expected_impact',
    'business_name', 'industry', 'industry_other', 'business_years_operating',
    'business_district', 'business_sector', 'business_summary',
    'planned_jobs', 'planned_jobs_for_women', 'budget_items', 'budget_total',
    'will_submit_business_plan', 'signature_name',
])]
class GrantApplication extends Model
{
    /** @use HasFactory<GrantApplicationFactory> */
    use HasFactory;

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => 'pending',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'province' => Province::class,
            'is_team' => 'boolean',
            'is_woman_led' => 'boolean',
            'is_adult' => 'boolean',
            'has_operated_one_year' => 'boolean',
            'is_main_occupation' => 'boolean',
            'can_continue_without_grant' => 'boolean',
            'creates_jobs' => 'boolean',
            'education_level' => EducationLevel::class,
            'has_related_training' => 'boolean',
            'received_previous_support' => 'boolean',
            'has_assets' => 'boolean',
            'industry' => Industry::class,
            'budget_items' => 'array',
            'will_submit_business_plan' => 'boolean',
            'qualification' => Qualification::class,
            'status' => ApplicationStatus::class,
            'business_plan_received_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    /**
     * The moment after which no new applications are accepted.
     */
    public static function deadline(): CarbonImmutable
    {
        return CarbonImmutable::parse(config('fondo.deadline'), config('fondo.timezone'));
    }

    /**
     * Determine if new applications are still being accepted.
     */
    public static function isAcceptingSubmissions(): bool
    {
        return now()->lessThanOrEqualTo(self::deadline());
    }

    /**
     * Normalize a Rwandan phone number to its local 10-digit form (07XXXXXXXX).
     */
    public static function normalizePhone(?string $phone): ?string
    {
        if ($phone === null) {
            return null;
        }

        $digits = preg_replace('/\D/', '', $phone);

        if (str_starts_with($digits, '250') && strlen($digits) === 12) {
            return '0'.substr($digits, 3);
        }

        return $digits;
    }

    /**
     * Get the administrator who last reviewed the application.
     *
     * @return BelongsTo<User, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * The human-friendly application number given to the applicant.
     *
     * @return Attribute<non-falsy-string, never>
     */
    protected function reference(): Attribute
    {
        return Attribute::get(fn (): string => sprintf('FR-%05d', $this->id));
    }

    /**
     * The applicant's age in full years at submission.
     *
     * @return Attribute<int, never>
     */
    protected function age(): Attribute
    {
        return Attribute::get(fn (): int => (int) $this->date_of_birth->diffInYears($this->created_at ?? now()));
    }

    /**
     * Only applications in the highly qualified tier, best scores first.
     *
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function highlyQualified(Builder $query): void
    {
        $query->where('qualification', Qualification::High)->ranked();
    }

    /**
     * Order applications from the highest score to the lowest.
     *
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function ranked(Builder $query): void
    {
        $query->orderByDesc('score')->oldest();
    }

    /**
     * Match applications by applicant name, business name, ID, phone or reference.
     *
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function search(Builder $query, string $term): void
    {
        $query->where(function (Builder $query) use ($term): void {
            $query->whereLike('full_name', "%{$term}%")
                ->orWhereLike('business_name', "%{$term}%")
                ->orWhere('national_id', preg_replace('/\s/', '', $term))
                ->orWhere('phone', self::normalizePhone($term));

            if (preg_match('/^FR-?(\d+)$/i', $term, $matches)) {
                $query->orWhereKey((int) $matches[1]);
            }
        });
    }
}
