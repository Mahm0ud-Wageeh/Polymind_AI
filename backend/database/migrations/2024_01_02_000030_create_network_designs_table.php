<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('network_designs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('project_id')->nullable()->constrained()->nullOnDelete();
            $table->uuid('conversation_id')->nullable();
            $table->foreignUuid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->longText('prompt');
            $table->string('status')->default('draft');
            $table->longText('summary')->nullable();
            $table->json('design_data')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['workspace_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('network_designs');
    }
};
