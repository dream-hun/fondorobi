<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('grant_applications', function (Blueprint $table) {
            $table->id();

            $table->string('full_name');
            $table->date('date_of_birth');
            $table->string('national_id', 16)->unique();
            $table->string('phone', 10)->unique();
            $table->string('email')->nullable();
            $table->string('province');
            $table->string('district')->index();
            $table->string('sector');
            $table->string('cell');
            $table->string('village');
            $table->boolean('is_team')->default(false);
            $table->string('team_representative_name')->nullable();
            $table->unsignedSmallInteger('team_members_count')->nullable();
            $table->unsignedSmallInteger('team_women_count')->nullable();

            $table->boolean('is_woman_led');
            $table->boolean('is_adult');
            $table->boolean('has_operated_one_year');
            $table->boolean('is_main_occupation');
            $table->boolean('can_continue_without_grant');
            $table->boolean('creates_jobs');

            $table->string('education_level');
            $table->string('education_level_other')->nullable();
            $table->boolean('has_related_training');
            $table->text('related_training_details')->nullable();
            $table->text('previous_work');
            $table->boolean('received_previous_support');
            $table->text('previous_support_details')->nullable();
            $table->boolean('has_assets');
            $table->text('assets_details')->nullable();
            $table->text('grant_need');
            $table->text('expected_impact');

            $table->string('business_name');
            $table->string('industry')->index();
            $table->string('industry_other')->nullable();
            $table->unsignedTinyInteger('business_years_operating');
            $table->string('business_district');
            $table->string('business_sector');
            $table->text('business_summary');
            $table->unsignedSmallInteger('planned_jobs');
            $table->unsignedSmallInteger('planned_jobs_for_women');
            $table->json('budget_items');
            $table->unsignedInteger('budget_total');

            $table->boolean('will_submit_business_plan')->default(false);
            $table->string('signature_name');

            $table->unsignedTinyInteger('score');
            $table->string('qualification');
            $table->string('status')->default('pending')->index();
            $table->text('review_notes')->nullable();
            $table->timestamp('business_plan_received_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();

            $table->timestamps();

            $table->index(['qualification', 'score']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grant_applications');
    }
};
