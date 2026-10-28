<?php

use App\Enums\Qualification;
use App\Models\GrantApplication;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * A complete, valid application as the multi-step form submits it.
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function validApplicationPayload(array $overrides = []): array
{
    return [
        'full_name' => 'Uwase Marie',
        'date_of_birth' => '1990-05-12',
        'national_id' => '1199070012345678',
        'phone' => '0788123456',
        'email' => '',
        'province' => 'south',
        'district' => 'Huye',
        'sector' => 'Ngoma',
        'cell' => 'Butare',
        'village' => 'Taba',
        'is_team' => false,
        'is_woman_led' => true,
        'is_adult' => true,
        'has_operated_one_year' => true,
        'is_main_occupation' => true,
        'can_continue_without_grant' => true,
        'creates_jobs' => true,
        'education_level' => 'secondary',
        'has_related_training' => true,
        'related_training_details' => 'Amahugurwa y\'ubudozi',
        'previous_work' => 'Nacuruzaga imyenda.',
        'received_previous_support' => false,
        'has_assets' => true,
        'assets_details' => 'Imashini ebyiri zidoda',
        'grant_need' => 'Ndashaka kwagura ubudozi bwanjye.',
        'expected_impact' => 'Abana banjye bazabona amafaranga y\'ishuri.',
        'business_name' => 'Uwase Couture',
        'industry' => 'tailoring',
        'business_years_operating' => '5',
        'business_district' => 'Huye',
        'business_sector' => 'Ngoma',
        'business_summary' => 'Kudoda imyenda y\'abanyeshuri.',
        'planned_jobs' => '10',
        'planned_jobs_for_women' => '6',
        'budget_items' => [
            ['description' => 'Imashini zidoda', 'quantity' => '4', 'amount' => '3000000'],
            ['description' => 'Ibitambaro', 'quantity' => '200 m', 'amount' => '2000000'],
        ],
        'will_submit_business_plan' => true,
        'signature_name' => 'Uwase Marie',
        'declaration' => true,
        ...$overrides,
    ];
}

test('the application form renders while submissions are open', function () {
    $this->travelTo(GrantApplication::deadline()->subDay());

    $this->get(route('apply.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('apply/create')
            ->where('isOpen', true)
            ->where('grantMinimum', 5_000_000)
            ->where('grantMaximum', 10_000_000)
            ->has('provinces', 5)
        );
});

test('the application form shows as closed after the deadline', function () {
    $this->travelTo(GrantApplication::deadline()->addMinute());

    $this->get(route('apply.create'))
        ->assertInertia(fn (Assert $page) => $page->where('isOpen', false));
});

test('a valid application is stored, scored and confirmed with its reference', function () {
    $this->travelTo(GrantApplication::deadline()->subDay());

    $response = $this->post(route('apply.store'), validApplicationPayload());

    $application = GrantApplication::sole();

    $response->assertSessionHasNoErrors()
        ->assertRedirect(route('apply.submitted'))
        ->assertSessionHas('reference', $application->reference);

    expect($application)
        ->full_name->toBe('Uwase Marie')
        ->budget_total->toBe(5_000_000)
        ->score->toBe(100)
        ->qualification->toBe(Qualification::High);

    $this->get(route('apply.submitted'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('apply/submitted')
            ->where('reference', $application->reference)
        );
});

test('the confirmation page redirects to the form when nothing was submitted', function () {
    $this->get(route('apply.submitted'))->assertRedirect(route('apply.create'));
});

test('the same national ID cannot apply twice', function () {
    $this->travelTo(GrantApplication::deadline()->subDay());
    GrantApplication::factory()->create(['national_id' => '1199070012345678']);

    $this->post(route('apply.store'), validApplicationPayload())
        ->assertSessionHasErrors([
            'national_id' => 'Iyi ndangamuntu yamaze gukoreshwa gusaba iyi nkunga. Umuntu umwe ntashobora gusaba inshuro ebyiri.',
        ]);

    expect(GrantApplication::count())->toBe(1);
});

test('the same phone number cannot apply twice, whatever its format', function () {
    $this->travelTo(GrantApplication::deadline()->subDay());
    GrantApplication::factory()->create(['phone' => '0788123456']);

    $this->post(route('apply.store'), validApplicationPayload(['phone' => '+250 788 123 456']))
        ->assertSessionHasErrors([
            'phone' => 'Iyi nimero ya telefoni yamaze gukoreshwa gusaba iyi nkunga. Umuntu umwe ntashobora gusaba inshuro ebyiri.',
        ]);

    expect(GrantApplication::count())->toBe(1);
});

test('a national ID whose birth year differs from the date of birth is rejected', function () {
    $this->travelTo(GrantApplication::deadline()->subDay());

    $this->post(route('apply.store'), validApplicationPayload(['national_id' => '1198570012345678']))
        ->assertSessionHasErrors([
            'national_id' => 'Umwaka w\'amavuko uri ku ndangamuntu ntuhura n\'itariki y\'amavuko watanze.',
        ]);
});

test('a budget outside the grant range is rejected', function (array $budgetItems) {
    $this->travelTo(GrantApplication::deadline()->subDay());

    $this->post(route('apply.store'), validApplicationPayload([
        'budget_items' => $budgetItems,
    ]))->assertSessionHasErrors([
        'budget_items' => 'Igiteranyo cy\'ingengo y\'imari kigomba kuba hagati ya 5.000.000 RWF na 10.000.000 RWF.',
    ]);

    expect(GrantApplication::count())->toBe(0);
})->with([
    'below the minimum' => [[
        ['description' => 'Imashini', 'quantity' => '5', 'amount' => '4000000'],
        ['description' => 'Ibitambaro', 'quantity' => '1', 'amount' => '999999'],
    ]],
    'above the maximum' => [[
        ['description' => 'Imashini', 'quantity' => '5', 'amount' => '8000000'],
        ['description' => 'Ibitambaro', 'quantity' => '1', 'amount' => '2000001'],
    ]],
]);

test('a budget at the grant maximum is accepted', function () {
    $this->travelTo(GrantApplication::deadline()->subDay());

    $this->post(route('apply.store'), validApplicationPayload([
        'budget_items' => [
            ['description' => 'Imashini zidoda', 'quantity' => '8', 'amount' => '6000000'],
            ['description' => 'Ibitambaro', 'quantity' => '400 m', 'amount' => '4000000'],
        ],
    ]))->assertSessionHasNoErrors();

    expect(GrantApplication::sole()->budget_total)->toBe(10_000_000);
});

test('an empty submission reports every required field in Kinyarwanda', function () {
    $this->travelTo(GrantApplication::deadline()->subDay());

    $this->post(route('apply.store'), [])
        ->assertSessionHasErrors([
            'full_name' => 'Iki gice kigomba kuzuzwa.',
            'national_id' => 'Iki gice kigomba kuzuzwa.',
            'is_woman_led' => 'Iki gice kigomba kuzuzwa.',
            'budget_items' => 'Iki gice kigomba kuzuzwa.',
            'declaration' => 'Ugomba kwemeza ko amakuru watanze ari ukuri.',
        ]);
});

test('team details are required only for team applications', function () {
    $this->travelTo(GrantApplication::deadline()->subDay());

    $this->post(route('apply.store'), validApplicationPayload(['is_team' => true]))
        ->assertSessionHasErrors(['team_representative_name', 'team_members_count', 'team_women_count']);

    $this->post(route('apply.store'), validApplicationPayload([
        'is_team' => false,
        'team_members_count' => 'not used',
    ]))->assertSessionHasNoErrors();

    expect(GrantApplication::sole()->team_members_count)->toBeNull();
});

test('an application answering no to a mandatory requirement is classified as not eligible', function (array $overrides) {
    $this->travelTo(GrantApplication::deadline()->subDay());

    $this->post(route('apply.store'), validApplicationPayload($overrides))->assertSessionHasNoErrors();

    expect(GrantApplication::sole()->qualification)->toBe(Qualification::NotEligible);
})->with([
    'not woman-led' => [['is_woman_led' => false]],
    'not an adult' => [['is_adult' => false]],
    'business younger than one year' => [['has_operated_one_year' => false]],
    'team with fewer than half women' => [[
        'is_team' => true,
        'team_representative_name' => 'Uwase Marie',
        'team_members_count' => '5',
        'team_women_count' => '2',
    ]],
]);

test('submissions after the deadline are refused with a Kinyarwanda message', function () {
    $this->travelTo(GrantApplication::deadline()->addMinute());

    $this->post(route('apply.store'), validApplicationPayload())
        ->assertSessionHasErrors(['deadline' => 'Igihe ntarengwa cyo gutanga ubusabe cyarangiye.']);

    expect(GrantApplication::count())->toBe(0);
});

test('a step can be validated on its own without storing the application', function () {
    $this->travelTo(GrantApplication::deadline()->subDay());
    GrantApplication::factory()->create(['national_id' => '1199070012345678']);

    $headers = ['Precognition' => 'true', 'Precognition-Validate-Only' => 'full_name,national_id,phone'];

    $this->postJson(route('apply.store'), ['full_name' => 'Uwase Marie', 'national_id' => '1199070012345678', 'phone' => '0788999999', 'date_of_birth' => '1990-05-12'], $headers)
        ->assertUnprocessable()
        ->assertOnlyJsonValidationErrors(['national_id']);

    $this->postJson(route('apply.store'), ['full_name' => 'Mukamana Jeanne', 'national_id' => '1199270012345678', 'phone' => '0788999999', 'date_of_birth' => '1992-01-01'], $headers)
        ->assertNoContent();

    expect(GrantApplication::count())->toBe(1);
});
