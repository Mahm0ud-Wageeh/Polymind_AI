<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds a `domain` column to agents and templates so the platform can scope
 * content by engineering discipline.
 *
 * Version 1 ships `networking`; future domains (cloud, devops, security)
 * will reuse this column instead of needing a separate migration.
 *
 * The column defaults to `networking` so existing seed rows are correctly
 * scoped even if the seeder doesn't set it explicitly.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agents', function (Blueprint $table) {
            $table->string('domain')->default('networking')->after('is_public');
            $table->index(['domain', 'is_public']);
        });

        Schema::table('templates', function (Blueprint $table) {
            $table->string('domain')->default('networking')->after('is_public');
            $table->index(['domain', 'is_public']);
        });
    }

    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->dropIndex(['domain', 'is_public']);
            $table->dropColumn('domain');
        });

        Schema::table('agents', function (Blueprint $table) {
            $table->dropIndex(['domain', 'is_public']);
            $table->dropColumn('domain');
        });
    }
};
