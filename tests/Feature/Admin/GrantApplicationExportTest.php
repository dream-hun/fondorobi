<?php

use App\Enums\ApplicationStatus;
use App\Enums\Qualification;
use App\Models\GrantApplication;
use App\Models\User;
use Illuminate\Testing\TestResponse;
use OpenSpout\Reader\XLSX\Reader;

/**
 * Read a downloaded workbook into rows keyed by column heading, per sheet name.
 *
 * @return array<string, list<array<string, mixed>>>
 */
function exportedSheets(TestResponse $response): array
{
    $reader = new Reader;
    $reader->open($response->baseResponse->getFile()->getPathname());

    $sheets = [];

    foreach ($reader->getSheetIterator() as $sheet) {
        $rows = [];

        foreach ($sheet->getRowIterator() as $row) {
            $rows[] = $row->toArray();
        }

        $headings = array_shift($rows);

        $sheets[$sheet->getName()] = array_map(fn (array $row): array => array_combine(
            $headings,
            array_pad($row, count($headings), null),
        ), $rows);
    }

    $reader->close();

    return $sheets;
}

afterEach(function () {
    array_map(unlink(...), glob(sys_get_temp_dir().'/applications*'));
});

test('guests are redirected to the login page', function () {
    $this->get(route('admin.applications.export'))->assertRedirect('/login');
});

test('users who are not administrators are forbidden', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('admin.applications.export'))
        ->assertForbidden();
});

test('an invalid filter is rejected', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.applications.export', ['status' => 'funded']))
        ->assertSessionHasErrors('status');
});

test('administrators download every application as a named Excel file', function () {
    $this->travelTo('2026-10-30 22:30:00');

    GrantApplication::factory()->count(25)->create();

    $response = $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.applications.export'))
        ->assertOk()
        ->assertDownload('fondo-robi-applications-2026-10-31.xlsx');

    expect($response->headers->get('Content-Type'))->toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        ->and(exportedSheets($response)['Applications'])->toHaveCount(25);
});

test('the export contains the full application with its review', function () {
    $this->travelTo('2026-10-30 22:30:00');

    $reviewer = User::factory()->admin()->create(['name' => 'Aline Reviewer']);
    $application = GrantApplication::factory()->create([
        'phone' => '0781234567',
        'national_id' => '1199070012345678',
        'date_of_birth' => '1990-05-17',
        'is_team' => true,
        'budget_total' => 5_000_000,
    ]);
    $application->forceFill([
        'status' => ApplicationStatus::Shortlisted,
        'review_notes' => 'Visit the workshop.',
        'reviewed_by' => $reviewer->id,
    ])->save();

    $row = exportedSheets($this->actingAs($reviewer)->get(route('admin.applications.export')))['Applications'][0];

    expect($row)
        ->{'Ref.'}->toBe($application->reference)
        ->{'Phone'}->toBe('0781234567')
        ->{'National ID'}->toBe('1199070012345678')
        ->{'Team application'}->toBe('Yes')
        ->{'Budget total (RWF)'}->toBe(5_000_000)
        ->{'Status'}->toBe('Shortlisted')
        ->{'Review notes'}->toBe('Visit the workshop.')
        ->{'Reviewed by'}->toBe('Aline Reviewer')
        ->{'Date of birth'}->format('Y-m-d')->toBe('1990-05-17')
        ->{'Submitted (Kigali time)'}->format('Y-m-d H:i')->toBe('2026-10-31 00:30');
});

test('budget items are listed on their own sheet', function () {
    $application = GrantApplication::factory()->create();

    $rows = exportedSheets($this->actingAs(User::factory()->admin()->create())->get(route('admin.applications.export')))['Budget items'];

    expect($rows)->toHaveCount(2)
        ->and($rows[0])->toBe([
            'Ref.' => $application->reference,
            'Applicant' => $application->full_name,
            'Business' => $application->business_name,
            'Description' => 'Imashini zidoda',
            'Quantity' => '2',
            'Amount (RWF)' => 3_000_000,
        ]);
});

test('the export applies the dashboard filters', function () {
    GrantApplication::factory()->highlyQualified()->create();
    $ineligible = GrantApplication::factory()->ineligible()->create();

    $sheets = exportedSheets($this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.applications.export', ['qualification' => Qualification::NotEligible->value])));

    expect($sheets['Applications'])->toHaveCount(1)
        ->and($sheets['Applications'][0]['Ref.'])->toBe($ineligible->reference)
        ->and(array_unique(array_column($sheets['Budget items'], 'Ref.')))->toBe([$ineligible->reference]);
});

test('the export follows the dashboard sort order', function (?string $sort, array $expectedOrder) {
    $this->travelTo('2026-10-01 10:00:00');
    $olderBest = GrantApplication::factory()->highlyQualified()->create();
    $this->travelTo('2026-10-02 10:00:00');
    $newerWorst = GrantApplication::factory()->ineligible()->create();

    $applications = ['older best' => $olderBest, 'newer worst' => $newerWorst];

    $rows = exportedSheets($this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.applications.export', array_filter(['sort' => $sort]))))['Applications'];

    expect(array_column($rows, 'Ref.'))->toBe(array_map(
        fn (string $name): string => $applications[$name]->reference,
        $expectedOrder,
    ));
})->with([
    'default is highest score' => [null, ['older best', 'newer worst']],
    'newest first' => ['newest', ['newer worst', 'older best']],
]);

test('each sheet has a frozen header row and a filter covering all its rows', function () {
    GrantApplication::factory()->count(2)->create();

    $response = $this->actingAs(User::factory()->admin()->create())->get(route('admin.applications.export'));

    $archive = new ZipArchive;
    $archive->open($response->baseResponse->getFile()->getPathname());
    $applicationsSheet = $archive->getFromName('xl/worksheets/sheet1.xml');
    $budgetSheet = $archive->getFromName('xl/worksheets/sheet2.xml');
    $archive->close();

    expect($applicationsSheet)->toContain('ySplit="1"')->toContain('<autoFilter ref="A1:BA3"')
        ->and($budgetSheet)->toContain('ySplit="1"')->toContain('<autoFilter ref="A1:F5"');
});

test('text an applicant typed as a formula is exported as plain text', function () {
    GrantApplication::factory()->create(['business_name' => '=HYPERLINK("http://evil.test","Click")']);

    $response = $this->actingAs(User::factory()->admin()->create())->get(route('admin.applications.export'));

    $archive = new ZipArchive;
    $archive->open($response->baseResponse->getFile()->getPathname());
    $worksheet = $archive->getFromName('xl/worksheets/sheet1.xml');
    $archive->close();

    expect($worksheet)->not->toContain('<f>')
        ->and(exportedSheets($response)['Applications'][0]['Business name'])->toBe('=HYPERLINK("http://evil.test","Click")');
});
