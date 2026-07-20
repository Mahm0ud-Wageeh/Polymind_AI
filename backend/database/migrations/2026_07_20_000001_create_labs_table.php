<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('labs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('workspace_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name', 200);
            $table->text('description')->nullable();
            $table->string('status', 20)->default('stopped');               // stopped | running | error
            $table->longText('clab_definition')->nullable();                 // the .clab.yml content
            $table->json('devices')->nullable();                             // parsed device list (name, kind, image, ports)
            $table->json('node_status')->nullable();                         // real-time per-node status from containerlab
            $table->string('lab_directory')->nullable();                     // containerlab lab directory on disk
            $table->timestamp('started_at')->nullable();
            $table->timestamp('stopped_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('labs');
    }
};
