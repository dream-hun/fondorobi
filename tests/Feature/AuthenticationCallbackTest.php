<?php

use Illuminate\Support\Facades\Log;

test('a sign-in callback without a code redirects home with an error toast', function (array $query) {
    $this->get('/authenticate?'.http_build_query($query))
        ->assertRedirect(route('home'))
        ->assertInertiaFlash('toast.type', 'error')
        ->assertInertiaFlash('toast.message', 'Sign-in was not completed. Please try again.');

    $this->assertGuest();
})->with([
    'no parameters' => [[]],
    'error returned by WorkOS' => [['error' => 'access_denied', 'error_description' => 'User cancelled sign-in.']],
]);

test('a sign-in callback without a code logs the reason WorkOS gave', function () {
    Log::spy();

    $this->get('/authenticate?error=access_denied&error_description=User+cancelled+sign-in.');

    Log::shouldHaveReceived('warning')->once()->with(
        'WorkOS sign-in returned without an authorization code.',
        ['error' => 'access_denied', 'error_description' => 'User cancelled sign-in.'],
    );
});
