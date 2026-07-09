<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('icon')->nullable();
            $table->text('description')->nullable();
            $table->longText('system_prompt')->nullable();
            $table->string('provider')->nullable();
            $table->string('model')->nullable();
            $table->decimal('temperature', 3, 2)->default(0.7);
            $table->json('tools')->nullable();
            $table->json('memory')->nullable();
            $table->boolean('is_public')->default(false);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['workspace_id', 'is_public']);
        });

        Schema::create('templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('icon')->nullable();
            $table->text('description')->nullable();
            $table->longText('prompt')->nullable();
            $table->string('category')->nullable();
            $table->boolean('is_public')->default(false);
            $table->timestamps();
        });

        Schema::create('artifacts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('message_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->enum('type', ['code', 'document', 'image', 'file']);
            $table->string('language')->nullable();
            $table->longText('content')->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->timestamps();
            $table->index('conversation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('artifacts');
        Schema::dropIfExists('templates');
        Schema::dropIfExists('agents');
    }
};
