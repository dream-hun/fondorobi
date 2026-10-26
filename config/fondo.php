<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Application Deadline
    |--------------------------------------------------------------------------
    |
    | The last moment, in Rwanda local time, at which beneficiaries may submit
    | a grant application. After this moment the public form is closed.
    |
    */

    'deadline' => env('FONDO_APPLICATION_DEADLINE', '2026-10-30 23:59:59'),

    'timezone' => 'Africa/Kigali',

    /*
    |--------------------------------------------------------------------------
    | Grant Amount
    |--------------------------------------------------------------------------
    |
    | The maximum amount, in Rwandan francs, an applicant may request. The
    | submitted budget table may not exceed this total.
    |
    */

    'grant_amount' => 5_000_000,

    /*
    |--------------------------------------------------------------------------
    | Help Line
    |--------------------------------------------------------------------------
    |
    | The phone number applicants can call for help filling in the form.
    |
    */

    'help_phone' => env('FONDO_HELP_PHONE', '0784407522'),

];
