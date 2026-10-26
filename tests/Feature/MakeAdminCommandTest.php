<?php

use App\Models\User;

test('the command grants administrator access to an existing user', function () {
    $user = User::factory()->create(['email' => 'reviewer@example.com']);

    $this->artisan('app:make-admin', ['email' => 'reviewer@example.com'])->assertSuccessful();

    expect($user->fresh()->is_admin)->toBeTrue();
});

test('the command revokes administrator access', function () {
    $user = User::factory()->admin()->create(['email' => 'reviewer@example.com']);

    $this->artisan('app:make-admin', ['email' => 'reviewer@example.com', '--revoke' => true])->assertSuccessful();

    expect($user->fresh()->is_admin)->toBeFalse();
});

test('the command fails for an unknown email', function () {
    $this->artisan('app:make-admin', ['email' => 'nobody@example.com'])->assertFailed();
});
