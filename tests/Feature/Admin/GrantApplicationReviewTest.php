<?php

use App\Enums\ApplicationStatus;
use App\Enums\Qualification;
use App\Models\GrantApplication;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

describe('index', function () {
    test('guests are redirected to the login page', function () {
        $this->get(route('admin.applications.index'))->assertRedirect('/login');
    });

    test('users who are not administrators are forbidden', function () {
        $this->actingAs(User::factory()->create())
            ->get(route('admin.applications.index'))
            ->assertForbidden();
    });

    test('administrators see highly qualified businesses ranked by score', function () {
        $best = GrantApplication::factory()->highlyQualified()->create();
        $good = GrantApplication::factory()->highlyQualified()->create(['will_submit_business_plan' => false]);
        GrantApplication::factory()->highlyQualified()->create()->forceFill(['status' => ApplicationStatus::Rejected])->save();
        GrantApplication::factory()->ineligible()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->get(route('admin.applications.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/applications/index')
                ->where('stats.total', 4)
                ->where('stats.byQualification.0.total', 3)
                ->where('stats.byQualification.3.total', 1)
                ->has('topCandidates', 2)
                ->where('topCandidates.0.id', $best->id)
                ->where('topCandidates.1.id', $good->id)
                ->where('applications.data.0.id', $best->id)
            );
    });

    test('administrators can filter applications by qualification', function () {
        GrantApplication::factory()->highlyQualified()->create();
        $ineligible = GrantApplication::factory()->ineligible()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->get(route('admin.applications.index', ['qualification' => Qualification::NotEligible->value]))
            ->assertInertia(fn (Assert $page) => $page
                ->has('applications.data', 1)
                ->where('applications.data.0.id', $ineligible->id)
            );
    });

    test('administrators can search applications by reference', function () {
        GrantApplication::factory()->create();
        $wanted = GrantApplication::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->get(route('admin.applications.index', ['search' => $wanted->reference]))
            ->assertInertia(fn (Assert $page) => $page
                ->has('applications.data', 1)
                ->where('applications.data.0.id', $wanted->id)
            );
    });
});

describe('show', function () {
    test('administrators see the application with its score breakdown', function () {
        $application = GrantApplication::factory()->ineligible()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->get(route('admin.applications.show', $application))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/applications/show')
                ->where('application.reference', $application->reference)
                ->has('breakdown', 10)
                ->where('ineligibilityReasons', ['Business has operated for less than one year.'])
            );
    });
});

describe('update', function () {
    test('administrators can record a review decision', function () {
        $admin = User::factory()->admin()->create();
        $application = GrantApplication::factory()->create();

        $this->actingAs($admin)
            ->patch(route('admin.applications.update', $application), [
                'status' => ApplicationStatus::Shortlisted->value,
                'review_notes' => 'Visit the workshop next week.',
                'business_plan_received' => true,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('admin.applications.show', $application));

        expect($application->fresh())
            ->status->toBe(ApplicationStatus::Shortlisted)
            ->review_notes->toBe('Visit the workshop next week.')
            ->business_plan_received_at->not->toBeNull()
            ->reviewed_by->toBe($admin->id);
    });

    test('an unknown review status is rejected', function () {
        $application = GrantApplication::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->patch(route('admin.applications.update', $application), [
                'status' => 'funded',
                'business_plan_received' => false,
            ])
            ->assertSessionHasErrors('status');

        expect($application->fresh()->status)->toBe(ApplicationStatus::Pending);
    });

    test('users who are not administrators cannot review applications', function () {
        $application = GrantApplication::factory()->create();

        $this->actingAs(User::factory()->create())
            ->patch(route('admin.applications.update', $application), [
                'status' => ApplicationStatus::Approved->value,
                'business_plan_received' => false,
            ])
            ->assertForbidden();

        expect($application->fresh()->status)->toBe(ApplicationStatus::Pending);
    });
});
