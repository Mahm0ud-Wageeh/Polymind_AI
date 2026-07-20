<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ToolEndpointTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_ip_plan_requires_authentication(): void
    {
        $this->postJson('/api/v1/tools/ip-plan')
            ->assertUnauthorized();
    }

    public function test_ip_plan_validates_required_fields(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/tools/ip-plan', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['workspace_id', 'cidr']);
    }

    public function test_ip_plan_returns_subnets(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Tool User',
            'email' => 'tooluser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $user = User::where('email', 'tooluser@example.com')->firstOrFail();
        Sanctum::actingAs($user);

        $workspaces = $this->getJson('/api/v1/workspaces')->json();
        $workspaceId = $workspaces[0]['id'];

        $this->postJson('/api/v1/tools/ip-plan', [
            'workspace_id' => $workspaceId,
            'cidr' => '10.0.0.0/24',
            'requirements' => [
                ['name' => 'Users', 'hosts' => 50],
                ['name' => 'Servers', 'hosts' => 10],
            ],
        ])->assertOk()
            ->assertJsonStructure(['summary', 'allocations', 'total_waste']);
    }

    public function test_validate_requires_authentication(): void
    {
        $this->postJson('/api/v1/tools/validate')
            ->assertUnauthorized();
    }

    public function test_validate_validates_design(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Validate User',
            'email' => 'validateuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $user = User::where('email', 'validateuser@example.com')->firstOrFail();
        Sanctum::actingAs($user);

        $workspaces = $this->getJson('/api/v1/workspaces')->json();
        $workspaceId = $workspaces[0]['id'];

        $this->postJson('/api/v1/tools/validate', [
            'workspace_id' => $workspaceId,
            'design' => [
                'name' => 'Test Network',
                'devices' => [['name' => 'R1']],
            ],
        ])->assertOk()
            ->assertJsonStructure(['issues', 'score', 'summary']);
    }

    public function test_config_diff_requires_authentication(): void
    {
        $this->postJson('/api/v1/tools/config-diff')
            ->assertUnauthorized();
    }

    public function test_config_diff_returns_diff(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Diff User',
            'email' => 'diffuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $user = User::where('email', 'diffuser@example.com')->firstOrFail();
        Sanctum::actingAs($user);

        $workspaces = $this->getJson('/api/v1/workspaces')->json();
        $workspaceId = $workspaces[0]['id'];

        $this->postJson('/api/v1/tools/config-diff', [
            'workspace_id' => $workspaceId,
            'original' => "hostname R1\nip route 0.0.0.0 0.0.0.0 10.0.0.1\n",
            'updated' => "hostname R1\nip route 0.0.0.0 0.0.0.0 10.0.0.2\n",
        ])->assertOk()
            ->assertJsonStructure(['chunks', 'summary']);
    }

    public function test_documentation_requires_authentication(): void
    {
        $this->postJson('/api/v1/tools/documentation/generate')
            ->assertUnauthorized();
    }

    public function test_documentation_returns_markdown(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Doc User',
            'email' => 'docuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $user = User::where('email', 'docuser@example.com')->firstOrFail();
        Sanctum::actingAs($user);

        $workspaces = $this->getJson('/api/v1/workspaces')->json();
        $workspaceId = $workspaces[0]['id'];

        // Create a network design first
        $design = $this->postJson('/api/v1/network-designs', [
            'workspace_id' => $workspaceId,
            'name' => 'Test Documentation',
            'prompt' => 'Test network',
        ])->assertCreated()->json();

        $this->postJson('/api/v1/tools/documentation/generate', [
            'workspace_id' => $workspaceId,
            'network_design_id' => $design['id'],
        ])->assertOk()
            ->assertJsonStructure(['filename', 'markdown']);
    }
}
