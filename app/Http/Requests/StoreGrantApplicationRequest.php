<?php

namespace App\Http\Requests;

use App\Enums\EducationLevel;
use App\Enums\Industry;
use App\Enums\Province;
use App\Models\GrantApplication;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class StoreGrantApplicationRequest extends FormRequest
{
    /**
     * Applications are only accepted until the deadline.
     */
    public function authorize(): bool
    {
        return GrantApplication::isAcceptingSubmissions();
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'national_id' => preg_replace('/\s/', '', (string) $this->input('national_id')),
            'phone' => GrantApplication::normalizePhone($this->input('phone')),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $grantAmount = (int) config('fondo.grant_amount');
        $province = Province::tryFrom((string) $this->input('province'));

        return [
            'full_name' => ['required', 'string', 'max:255'],
            'date_of_birth' => ['required', 'date', 'before:today', 'after:1920-01-01'],
            'national_id' => [
                'required',
                'regex:/^[1-3]\d{15}$/',
                Rule::unique(GrantApplication::class, 'national_id'),
                $this->nationalIdMatchesBirthYear(...),
            ],
            'phone' => [
                'required',
                'regex:/^07[2389]\d{7}$/',
                Rule::unique(GrantApplication::class, 'phone'),
            ],
            'email' => ['nullable', 'email', 'max:255'],
            'province' => ['required', Rule::enum(Province::class)],
            'district' => ['required', Rule::in($province?->districts() ?? [])],
            'sector' => ['required', 'string', 'max:100'],
            'cell' => ['required', 'string', 'max:100'],
            'village' => ['required', 'string', 'max:100'],
            'is_team' => ['required', 'boolean'],
            'team_representative_name' => [Rule::excludeIf(! $this->boolean('is_team')), 'required', 'string', 'max:255'],
            'team_members_count' => [Rule::excludeIf(! $this->boolean('is_team')), 'required', 'integer', 'min:2', 'max:1000'],
            'team_women_count' => [Rule::excludeIf(! $this->boolean('is_team')), 'required', 'integer', 'min:0', 'lte:team_members_count'],

            'is_woman_led' => ['required', 'boolean'],
            'is_adult' => ['required', 'boolean'],
            'has_operated_one_year' => ['required', 'boolean'],
            'is_main_occupation' => ['required', 'boolean'],
            'can_continue_without_grant' => ['required', 'boolean'],
            'creates_jobs' => ['required', 'boolean'],

            'education_level' => ['required', Rule::enum(EducationLevel::class)],
            'education_level_other' => [Rule::excludeIf($this->input('education_level') !== EducationLevel::Other->value), 'required', 'string', 'max:255'],
            'has_related_training' => ['required', 'boolean'],
            'related_training_details' => [Rule::excludeIf(! $this->boolean('has_related_training')), 'required', 'string', 'max:2000'],
            'previous_work' => ['required', 'string', 'max:2000'],
            'received_previous_support' => ['required', 'boolean'],
            'previous_support_details' => [Rule::excludeIf(! $this->boolean('received_previous_support')), 'required', 'string', 'max:2000'],
            'has_assets' => ['required', 'boolean'],
            'assets_details' => [Rule::excludeIf(! $this->boolean('has_assets')), 'required', 'string', 'max:2000'],
            'grant_need' => ['required', 'string', 'max:3000'],
            'expected_impact' => ['required', 'string', 'max:3000'],

            'business_name' => ['required', 'string', 'max:255'],
            'industry' => ['required', Rule::enum(Industry::class)],
            'industry_other' => [Rule::excludeIf($this->input('industry') !== Industry::Other->value), 'required', 'string', 'max:255'],
            'business_years_operating' => ['required', 'integer', 'min:0', 'max:99'],
            'business_district' => ['required', Rule::in(Province::allDistricts())],
            'business_sector' => ['required', 'string', 'max:100'],
            'business_summary' => ['required', 'string', 'max:3000'],
            'planned_jobs' => ['required', 'integer', 'min:0', 'max:10000'],
            'planned_jobs_for_women' => ['required', 'integer', 'min:0', 'lte:planned_jobs'],
            'budget_items' => ['required', 'array', 'min:1', 'max:20', $this->budgetWithinGrant(...)],
            'budget_items.*.description' => ['required', 'string', 'max:255'],
            'budget_items.*.quantity' => ['required', 'string', 'max:100'],
            'budget_items.*.amount' => ['required', 'integer', 'min:1', "max:{$grantAmount}"],

            'will_submit_business_plan' => ['required', 'boolean'],
            'signature_name' => ['required', 'string', 'max:255'],
            'declaration' => ['accepted'],
        ];
    }

    /**
     * Get the Kinyarwanda validation messages shown to applicants.
     *
     * @return array<string, string|array<string, string>>
     */
    public function messages(): array
    {
        return [
            'required' => 'Iki gice kigomba kuzuzwa.',
            'string' => 'Andika amagambo.',
            'integer' => 'Andika umubare wuzuye.',
            'boolean' => 'Hitamo Yego cyangwa Oya.',
            'date' => 'Itariki ntiyanditse neza.',
            'email' => 'Imeri ntiyanditse neza (urugero: izina@gmail.com).',
            'in' => 'Hitamo kimwe mu byatanzwe.',
            'enum' => 'Hitamo kimwe mu byatanzwe.',
            'accepted' => 'Ugomba kwemeza ko amakuru watanze ari ukuri.',
            'max' => [
                'string' => 'Ntibigomba kurenza inyuguti :max.',
                'numeric' => 'Umubare ntugomba kurenza :max.',
                'array' => 'Ntibigomba kurenza ibintu :max.',
            ],
            'min' => [
                'numeric' => 'Umubare ntugomba kujya munsi ya :min.',
                'array' => 'Andika nibura ikintu kimwe.',
            ],
            'date_of_birth.before' => 'Itariki y\'amavuko igomba kuba mbere y\'uyu munsi.',
            'date_of_birth.after' => 'Itariki y\'amavuko ntiyanditse neza.',
            'national_id.regex' => 'Nimero y\'indangamuntu igomba kuba igizwe n\'imibare 16.',
            'national_id.unique' => 'Iyi ndangamuntu yamaze gukoreshwa gusaba iyi nkunga. Umuntu umwe ntashobora gusaba inshuro ebyiri.',
            'phone.regex' => 'Andika nimero ya telefoni neza (urugero: 0788123456).',
            'phone.unique' => 'Iyi nimero ya telefoni yamaze gukoreshwa gusaba iyi nkunga. Umuntu umwe ntashobora gusaba inshuro ebyiri.',
            'district.in' => 'Hitamo akarere kari mu ntara wahisemo.',
            'team_women_count.lte' => 'Umubare w\'abagore ntushobora kurenga umubare w\'abagize itsinda bose.',
            'planned_jobs_for_women.lte' => 'Imirimo izahabwa abagore ntishobora kurenga imirimo yose uteganya.',
        ];
    }

    /**
     * Turn a submission after the deadline into a friendly Kinyarwanda error.
     *
     * @throws ValidationException
     */
    protected function failedAuthorization(): void
    {
        throw ValidationException::withMessages([
            'deadline' => 'Igihe ntarengwa cyo gutanga ubusabe cyarangiye.',
        ]);
    }

    /**
     * The validated data shaped as grant application attributes.
     *
     * @return array<string, mixed>
     */
    public function applicationAttributes(): array
    {
        $budgetItems = array_map(fn (array $item): array => [
            'description' => $item['description'],
            'quantity' => $item['quantity'],
            'amount' => (int) $item['amount'],
        ], $this->validated('budget_items'));

        return [
            ...$this->safe()->except(['declaration', 'budget_items']),
            'budget_items' => $budgetItems,
            'budget_total' => array_sum(array_column($budgetItems, 'amount')),
        ];
    }

    /**
     * The four digits after the first one in a Rwandan ID are the holder's birth year.
     */
    private function nationalIdMatchesBirthYear(string $attribute, mixed $value, Closure $fail): void
    {
        $dateOfBirth = (string) $this->input('date_of_birth');

        if (preg_match('/^(\d{4})-/', $dateOfBirth, $matches) && substr((string) $value, 1, 4) !== $matches[1]) {
            $fail('Umwaka w\'amavuko uri ku ndangamuntu ntuhura n\'itariki y\'amavuko watanze.');
        }
    }

    /**
     * The budget may not exceed the grant amount.
     */
    private function budgetWithinGrant(string $attribute, mixed $value, Closure $fail): void
    {
        $total = collect(is_array($value) ? $value : [])
            ->sum(fn (mixed $item): int => is_array($item) && is_numeric($item['amount'] ?? null) ? (int) $item['amount'] : 0);

        if ($total > (int) config('fondo.grant_amount')) {
            $fail('Igiteranyo cy\'ingengo y\'imari ntigishobora kurenga 5.000.000 RWF.');
        }
    }
}
