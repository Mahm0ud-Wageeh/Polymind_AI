<?php

namespace App\Services\Tenancy;

use App\Models\Organization;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Creates the default organization + workspace for a freshly registered user
 * and marks the workspace as the user's current one.
 */
class WorkspaceProvisioner
{
    public function bootstrap(User $user): Workspace
    {
        return DB::transaction(function () use ($user) {
            $org = Organization::create([
                'name' => "{$user->name}'s Organization",
                'slug' => $this->uniqueSlug('organizations', $user->name),
                'owner_id' => $user->id,
                'plan' => 'free',
            ]);

            $org->members()->attach($user->id, [
                'id' => (string) Str::uuid(),
                'role' => 'owner',
                'joined_at' => now(),
            ]);

            $workspace = $org->workspaces()->create([
                'name' => 'Personal Workspace',
                'slug' => 'personal',
            ]);

            $org->subscriptions()->create([
                'plan' => 'free',
                'status' => 'active',
                'seats' => 1,
            ]);

            $user->forceFill(['current_workspace_id' => $workspace->id])->save();

            return $workspace;
        });
    }

    protected function uniqueSlug(string $table, string $name): string
    {
        $base = Str::slug($name) ?: 'org';
        $slug = $base;
        $i = 1;
        while (DB::table($table)->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }
}
