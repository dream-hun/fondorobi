<?php

use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\WorkOS\Http\Requests\AuthKitAuthenticationRequest;
use Laravel\WorkOS\Http\Requests\AuthKitLoginRequest;
use Laravel\WorkOS\Http\Requests\AuthKitLogoutRequest;
use WorkOS\Exception\WorkOSException;

Route::middleware(['guest'])->group(function () {
    Route::get('login', fn (AuthKitLoginRequest $request) => $request->redirect())->name('login');

    Route::get('authenticate', function (AuthKitAuthenticationRequest $request): RedirectResponse {
        $signInFailed = function (): RedirectResponse {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Sign-in was not completed. Please try again.')]);

            return to_route('home');
        };

        if (! $request->filled('code')) {
            Log::warning('WorkOS sign-in returned without an authorization code.', $request->only('error', 'error_description'));

            return $signInFailed();
        }

        $redirect = redirect()->intended(route('dashboard'));

        try {
            $request->authenticate();
        } catch (WorkOSException $exception) {
            report($exception);

            return $signInFailed();
        }

        return $redirect;
    });
});

Route::post('logout', fn (AuthKitLogoutRequest $request) => $request->logout())
    ->middleware(['auth'])->name('logout');
