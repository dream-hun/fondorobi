<?php

namespace App\Http\Controllers;

use App\Enums\EducationLevel;
use App\Enums\Industry;
use App\Enums\Province;
use App\Http\Requests\StoreGrantApplicationRequest;
use App\Models\GrantApplication;
use App\Services\GrantApplicationScorer;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class GrantApplicationController extends Controller
{
    /**
     * Show the multi-step grant application form.
     */
    public function create(): Response
    {
        return Inertia::render('apply/create', [
            'isOpen' => GrantApplication::isAcceptingSubmissions(),
            'deadline' => GrantApplication::deadline()->toDateString(),
            'grantMinimum' => (int) config('fondo.grant_minimum'),
            'grantMaximum' => (int) config('fondo.grant_maximum'),
            'helpPhone' => config('fondo.help_phone'),
            'provinces' => Province::options(),
            'industries' => array_map(fn (Industry $industry): array => [
                'value' => $industry->value,
                'label' => $industry->label(),
            ], Industry::cases()),
            'educationLevels' => array_map(fn (EducationLevel $level): array => [
                'value' => $level->value,
                'label' => $level->label(),
            ], EducationLevel::cases()),
        ]);
    }

    /**
     * Store and assess a new grant application.
     */
    public function store(StoreGrantApplicationRequest $request, GrantApplicationScorer $scorer): RedirectResponse
    {
        $application = $scorer->assess(new GrantApplication($request->applicationAttributes()));

        try {
            $application->save();
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages([
                'national_id' => 'Ubusabe bufite iyi ndangamuntu cyangwa iyi nimero ya telefoni bwamaze kwakirwa. Umuntu umwe ntashobora gusaba inshuro ebyiri.',
            ]);
        }

        return to_route('apply.submitted')->with('reference', $application->reference);
    }

    /**
     * Show the confirmation page after a successful submission.
     */
    public function submitted(Request $request): Response|RedirectResponse
    {
        $reference = $request->session()->get('reference');

        if ($reference === null) {
            return to_route('apply.create');
        }

        return Inertia::render('apply/submitted', [
            'reference' => $reference,
            'helpPhone' => config('fondo.help_phone'),
        ]);
    }
}
