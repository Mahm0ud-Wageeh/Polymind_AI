<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ToolTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
    }

    public function test_tools_endpoint_returns_builtin_and_mcp(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/tools')
            ->assertOk()
            ->assertJsonStructure([
                'builtin' => [['id', 'name', 'description', 'icon', 'category']],
                'mcp_servers',
            ]);
    }

    public function test_tools_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/v1/tools')->assertUnauthorized();
    }
}
