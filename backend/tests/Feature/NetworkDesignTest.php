<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NetworkDesignTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_generate_requires_authentication(): void
    {
        $this->postJson('/api/v1/network-designs/generate')
            ->assertUnauthorized();
    }

    public function test_generate_validates_required_fields(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/network-designs/generate', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['workspace_id', 'prompt']);
    }

    public function test_can_list_designs(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/network-designs')
            ->assertOk()
            ->assertJson([]);
    }

    public function test_store_creates_a_draft_design(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        // Create a workspace for the user first
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Designer User',
            'email' => 'designer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $user = User::where('email', 'designer@example.com')->firstOrFail();
        Sanctum::actingAs($user);

        $workspaces = $this->getJson('/api/v1/workspaces')->json();
        $workspaceId = $workspaces[0]['id'];

        $this->postJson('/api/v1/network-designs', [
            'workspace_id' => $workspaceId,
            'name' => 'Test Network Design',
            'prompt' => 'Design a small office network with 50 employees',
        ])->assertCreated()
            ->assertJsonPath('status', 'draft')
            ->assertJsonStructure(['id', 'name', 'prompt', 'status']);
    }
}
