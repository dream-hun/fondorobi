<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ApplicationStatus;
use App\Enums\EducationLevel;
use App\Enums\Industry;
use App\Enums\Province;
use App\Enums\Qualification;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReviewGrantApplicationRequest;
use App\Models\GrantApplication;
use App\Services\GrantApplicationExporter;
use App\Services\GrantApplicationScorer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class GrantApplicationController extends Controller
{
    /**
     * Show the review dashboard with classification stats and the filtered application list.
     */
    public function index(Request $request): Response
    {
        $filters = $this->validatedFilters($request);

        $applications = $this->filteredApplications($filters)
            ->select([
                'id', 'full_name', 'business_name', 'industry', 'district', 'is_team',
                'score', 'qualification', 'status', 'created_at',
            ])
            ->paginate(20)
            ->withQueryString()
            ->through(fn (GrantApplication $application): array => $this->summary($application));

        return Inertia::render('admin/applications/index', [
            'applications' => $applications,
            'filters' => $filters,
            'stats' => $this->stats(),
            'topCandidates' => GrantApplication::query()
                ->highlyQualified()
                ->where('status', '!=', ApplicationStatus::Rejected)
                ->limit(5)
                ->get(['id', 'full_name', 'business_name', 'industry', 'district', 'is_team', 'score', 'qualification', 'status', 'created_at'])
                ->map(fn (GrantApplication $application): array => $this->summary($application)),
            'options' => [
                'qualifications' => $this->enumOptions(Qualification::cases()),
                'statuses' => $this->enumOptions(ApplicationStatus::cases()),
                'industries' => array_map(fn (Industry $industry): array => [
                    'value' => $industry->value,
                    'label' => $industry->adminLabel(),
                ], Industry::cases()),
                'provinces' => Province::options(),
            ],
        ]);
    }

    /**
     * Download every application matching the dashboard filters as an Excel workbook.
     */
    public function export(Request $request, GrantApplicationExporter $exporter): BinaryFileResponse
    {
        $applications = $this->filteredApplications($this->validatedFilters($request))
            ->with('reviewer:id,name')
            ->orderBy('id')
            ->lazy(200);

        $filename = 'fondo-robi-applications-'.now(config('fondo.timezone'))->toDateString().'.xlsx';

        return response()
            ->download($exporter->export($applications), $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])
            ->deleteFileAfterSend();
    }

    /**
     * Show a single application with its score breakdown and review form.
     */
    public function show(GrantApplication $application, GrantApplicationScorer $scorer): Response
    {
        $application->load('reviewer:id,name');

        return Inertia::render('admin/applications/show', [
            'application' => [
                ...$application->toArray(),
                'reference' => $application->reference,
                'age' => $application->age,
                'province_label' => $application->province->label(),
                'education_level_label' => $application->education_level->adminLabel(),
                'industry_label' => $application->industry->adminLabel(),
                'qualification_label' => $application->qualification->label(),
                'status_label' => $application->status->label(),
            ],
            'breakdown' => $scorer->breakdown($application),
            'ineligibilityReasons' => $scorer->ineligibilityReasons($application),
            'statuses' => $this->enumOptions(ApplicationStatus::cases()),
        ]);
    }

    /**
     * Record an administrator's review decision.
     */
    public function update(ReviewGrantApplicationRequest $request, GrantApplication $application): RedirectResponse
    {
        $application->status = $request->enum('status', ApplicationStatus::class);
        $application->review_notes = $request->validated('review_notes');
        $application->business_plan_received_at = $request->boolean('business_plan_received')
            ? ($application->business_plan_received_at ?? now())
            : null;
        $application->reviewed_by = $request->user()->id;
        $application->reviewed_at = now();
        $application->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Review saved.')]);

        return to_route('admin.applications.show', $application);
    }

    /**
     * Validate the dashboard's search, filter and sort parameters.
     *
     * @return array<string, mixed>
     */
    private function validatedFilters(Request $request): array
    {
        return $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'qualification' => ['nullable', Rule::enum(Qualification::class)],
            'status' => ['nullable', Rule::enum(ApplicationStatus::class)],
            'industry' => ['nullable', Rule::enum(Industry::class)],
            'province' => ['nullable', Rule::enum(Province::class)],
            'district' => ['nullable', Rule::in(Province::allDistricts())],
            'applicant_type' => ['nullable', Rule::in(['individual', 'team'])],
            'sort' => ['nullable', Rule::in(['score', 'newest'])],
        ]);
    }

    /**
     * Build the query for applications matching the dashboard filters, in their sort order.
     *
     * @param  array<string, mixed>  $filters
     * @return Builder<GrantApplication>
     */
    private function filteredApplications(array $filters): Builder
    {
        return GrantApplication::query()
            ->when($filters['search'] ?? null, fn (Builder $query, string $search) => $query->search($search))
            ->when($filters['qualification'] ?? null, fn (Builder $query, string $value) => $query->where('qualification', $value))
            ->when($filters['status'] ?? null, fn (Builder $query, string $value) => $query->where('status', $value))
            ->when($filters['industry'] ?? null, fn (Builder $query, string $value) => $query->where('industry', $value))
            ->when($filters['province'] ?? null, fn (Builder $query, string $value) => $query->where('province', $value))
            ->when($filters['district'] ?? null, fn (Builder $query, string $value) => $query->where('district', $value))
            ->when($filters['applicant_type'] ?? null, fn (Builder $query, string $value) => $query->where('is_team', $value === 'team'))
            ->when(
                ($filters['sort'] ?? 'score') === 'newest',
                fn (Builder $query) => $query->latest()->latest('id'),
                fn (Builder $query) => $query->ranked(),
            );
    }

    /**
     * Shape an application for list views.
     *
     * @return array<string, mixed>
     */
    private function summary(GrantApplication $application): array
    {
        return [
            'id' => $application->id,
            'reference' => $application->reference,
            'full_name' => $application->full_name,
            'business_name' => $application->business_name,
            'industry' => $application->industry->adminLabel(),
            'district' => $application->district,
            'is_team' => $application->is_team,
            'score' => $application->score,
            'qualification' => $application->qualification->value,
            'qualification_label' => $application->qualification->label(),
            'status' => $application->status->value,
            'status_label' => $application->status->label(),
            'submitted_at' => $application->created_at?->toDateString(),
        ];
    }

    /**
     * Aggregate counts used to classify applications on the dashboard.
     *
     * @return array<string, mixed>
     */
    private function stats(): array
    {
        $countBy = fn (string $column): array => GrantApplication::query()
            ->toBase()
            ->select("{$column} as value")
            ->selectRaw('count(*) as total')
            ->groupBy($column)
            ->pluck('total', 'value')
            ->map(fn (mixed $total): int => (int) $total)
            ->all();

        $byQualification = $countBy('qualification');
        $byStatus = $countBy('status');
        $byIndustry = $countBy('industry');
        $byEducation = $countBy('education_level');
        $byDistrict = $countBy('district');
        arsort($byDistrict);

        return [
            'total' => array_sum($byQualification),
            'averageScore' => (int) round((float) GrantApplication::query()->avg('score')),
            'teams' => GrantApplication::query()->where('is_team', true)->count(),
            'byQualification' => array_map(fn (Qualification $case): array => [
                'value' => $case->value,
                'label' => $case->label(),
                'total' => $byQualification[$case->value] ?? 0,
            ], Qualification::cases()),
            'byStatus' => array_map(fn (ApplicationStatus $case): array => [
                'value' => $case->value,
                'label' => $case->label(),
                'total' => $byStatus[$case->value] ?? 0,
            ], ApplicationStatus::cases()),
            'byIndustry' => array_map(fn (Industry $case): array => [
                'value' => $case->value,
                'label' => $case->adminLabel(),
                'total' => $byIndustry[$case->value] ?? 0,
            ], Industry::cases()),
            'byEducation' => array_map(fn (EducationLevel $case): array => [
                'value' => $case->value,
                'label' => $case->adminLabel(),
                'total' => $byEducation[$case->value] ?? 0,
            ], EducationLevel::cases()),
            'topDistricts' => collect($byDistrict)
                ->take(8)
                ->map(fn (int $total, string $district): array => ['value' => $district, 'label' => $district, 'total' => $total])
                ->values()
                ->all(),
        ];
    }

    /**
     * Shape enum cases as select options.
     *
     * @param  array<int, Qualification|ApplicationStatus>  $cases
     * @return list<array{value: string, label: string}>
     */
    private function enumOptions(array $cases): array
    {
        return array_values(array_map(fn (Qualification|ApplicationStatus $case): array => [
            'value' => $case->value,
            'label' => $case->label(),
        ], $cases));
    }
}
