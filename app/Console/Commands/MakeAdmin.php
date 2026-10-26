<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:make-admin {email : The email of a user who has already signed in} {--revoke : Remove administrator access instead}')]
#[Description('Grant (or revoke) access to the grant applications review dashboard')]
class MakeAdmin extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $user = User::query()->where('email', $this->argument('email'))->first();

        if ($user === null) {
            $this->error('No user found with that email. Ask them to sign in once first.');

            return self::FAILURE;
        }

        $user->is_admin = ! $this->option('revoke');
        $user->save();

        $this->info($user->is_admin
            ? "{$user->email} can now review grant applications."
            : "{$user->email} can no longer review grant applications.");

        return self::SUCCESS;
    }
}
