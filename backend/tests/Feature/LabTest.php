<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LabTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_index_requires_authentication(): void
    {
        $this->getJson('/api/v1/labs')->assertUnauthorized();
    }

    public function test_store_requires_authentication(): void
    {
        $this->postJson('/api/v1/labs', ['name' => 'Test Lab'])->assertUnauthorized();
    }

    public function test_create_and_list_labs(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        // Empty list initially
        $this->getJson('/api/v1/labs')
            ->assertOk()
            ->assertJson([]);

        // Create a lab
        $this->postJson('/api/v1/labs', [
            'name' => 'My Test Lab',
            'description' => 'A lab for testing',
        ])->assertCreated()
            ->assertJsonPath('name', 'My Test Lab')
            ->assertJsonPath('status', 'stopped')
            ->assertJsonStructure(['id', 'name', 'clab_definition']);

        // List should have one entry
        $this->getJson('/api/v1/labs')
            ->assertOk()
            ->assertJsonCount(1);
    }

    public function test_create_lab_with_devices(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/labs', [
            'name' => 'Lab with devices',
            'devices' => [
                ['name' => 'Router1', 'kind' => 'vr-cisco'],
                ['name' => 'Switch1', 'kind' => 'catalyst'],
            ],
        ])->assertCreated()
            ->assertJsonStructure(['clab_definition', 'devices']);
    }

    public function test_lab_requires_name(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/labs', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_show_lab(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $lab = $this->postJson('/api/v1/labs', ['name' => 'Show Lab'])->json();

        $this->getJson("/api/v1/labs/{$lab['id']}")
            ->assertOk()
            ->assertJsonPath('name', 'Show Lab');
    }

    public function test_show_lab_denies_other_user(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $lab = $this->postJson('/api/v1/labs', ['name' => 'Private Lab'])->json();

        $other = User::factory()->create();
        Sanctum::actingAs($other);

        $this->getJson("/api/v1/labs/{$lab['id']}")->assertForbidden();
    }

    public function test_update_lab(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $lab = $this->postJson('/api/v1/labs', ['name' => 'Original Name'])->json();

        $this->patchJson("/api/v1/labs/{$lab['id']}", [
            'name' => 'Updated Name',
        ])->assertOk()
            ->assertJsonPath('name', 'Updated Name');
    }

    public function test_delete_lab(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $lab = $this->postJson('/api/v1/labs', ['name' => 'Delete Me'])->json();

        $this->deleteJson("/api/v1/labs/{$lab['id']}")->assertNoContent();

        $this->getJson('/api/v1/labs')->assertOk()->assertJson([]);
    }

    public function test_start_lab(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $lab = $this->postJson('/api/v1/labs', ['name' => 'Start Lab'])->json();

        $this->postJson("/api/v1/labs/{$lab['id']}/start")
            ->assertOk()
            ->assertJsonPath('status', 'running');
    }

    public function test_stop_lab(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $lab = $this->postJson('/api/v1/labs', ['name' => 'Stop Lab'])->json();

        $this->postJson("/api/v1/labs/{$lab['id']}/start")->assertOk();
        $this->postJson("/api/v1/labs/{$lab['id']}/stop")
            ->assertOk()
            ->assertJsonPath('status', 'stopped');
    }

    public function test_refresh_lab(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $lab = $this->postJson('/api/v1/labs', ['name' => 'Refresh Lab'])->json();
        $this->postJson("/api/v1/labs/{$lab['id']}/start")->assertOk();

        $this->postJson("/api/v1/labs/{$lab['id']}/refresh")
            ->assertOk()
            ->assertJsonStructure(['node_status']);
    }

    public function test_start_requires_ownership(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $lab = $this->postJson('/api/v1/labs', ['name' => 'Other Lab'])->json();

        $other = User::factory()->create();
        Sanctum::actingAs($other);

        $this->postJson("/api/v1/labs/{$lab['id']}/start")->assertForbidden();
    }
}
