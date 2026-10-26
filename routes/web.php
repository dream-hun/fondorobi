<?php

use App\Http\Controllers\Admin\GrantApplicationController as AdminGrantApplicationController;
use App\Http\Controllers\GrantApplicationController;
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;
use Illuminate\Support\Facades\Route;
use Laravel\WorkOS\Http\Middleware\ValidateSessionWithWorkOS;

Route::redirect('/', '/gusaba')->name('home');

Route::get('gusaba', [GrantApplicationController::class, 'create'])->name('apply.create');
Route::post('gusaba', [GrantApplicationController::class, 'store'])
    ->middleware([HandlePrecognitiveRequests::class, 'throttle:60,1'])
    ->name('apply.store');
Route::get('gusaba/byakiriwe', [GrantApplicationController::class, 'submitted'])->name('apply.submitted');

Route::middleware([
    'auth',
    ValidateSessionWithWorkOS::class,
])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::middleware('can:review-applications')->prefix('admin')->name('admin.')->group(function () {
        Route::get('applications', [AdminGrantApplicationController::class, 'index'])->name('applications.index');
        Route::get('applications/{application}', [AdminGrantApplicationController::class, 'show'])->name('applications.show');
        Route::patch('applications/{application}', [AdminGrantApplicationController::class, 'update'])->name('applications.update');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
